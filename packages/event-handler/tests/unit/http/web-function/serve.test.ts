import { once } from 'node:events';
import { createServer, Server } from 'node:http';
import { type AddressInfo, connect } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { InvokeStore, InvokeStoreBase } from '@aws/lambda-invoke-store';
import { shouldUseInvokeStore } from '@aws-lambda-powertools/commons/utils/env';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCodes, Router } from '../../../../src/http/index.js';
import {
  createContext,
  RequestScopedStore,
  serve,
} from '../../../../src/http/web-function/serve.js';
import type { WebFunctionServeOptions } from '../../../../src/types/http.js';

const INVOKE_STORE_OPT_IN_KEY = Symbol.for(
  'aws-lambda-powertools.commons.useInvokeStore'
);
const servers: Server[] = [];
const spies: { mockRestore: () => void }[] = [];

/**
 * Closes the servers, restores the spies, and resets the process-wide state
 * that `serve()` changes, so that each test starts from scratch.
 */
const cleanUp = () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    server.close();
  }
  for (const spy of spies.splice(0)) spy.mockRestore();
  vi.unstubAllEnvs();
  InvokeStore._testing?.reset();
  delete (globalThis as Record<symbol, unknown>)[INVOKE_STORE_OPT_IN_KEY];
};

/**
 * Starts the server on a random port and returns its base URL.
 */
const start = async (app: Router, options?: WebFunctionServeOptions) => {
  vi.stubEnv('AWS_LAMBDA_HTTP_ENDPOINT', '127.0.0.1:0');
  const server = await serve(app, { shutdown: false, ...options });
  servers.push(server);
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
};

/**
 * Opens a raw TCP connection to the server and sends a request on it.
 */
const openRaw = async (baseUrl: string, payload: string) => {
  const { port } = new URL(baseUrl);
  const socket = connect(Number(port), '127.0.0.1');
  await once(socket, 'connect');
  socket.write(payload);
  return socket;
};

/**
 * Sends a raw HTTP request and returns the raw response.
 */
const sendRaw = async (baseUrl: string, payload: string) => {
  const socket = await openRaw(baseUrl, payload);
  socket.end();
  let response = '';
  for await (const chunk of socket) response += chunk;
  return response;
};

/**
 * Captures the `SIGTERM` listener registered by `serve()` without installing it.
 */
const captureShutdownListener = () => {
  const listeners: (() => Promise<void>)[] = [];
  spies.push(
    vi.spyOn(process, 'once').mockImplementation((event, listener) => {
      if (event === 'SIGTERM') listeners.push(listener as () => Promise<void>);
      return process;
    })
  );
  return listeners;
};

/**
 * Registers a route whose handler never returns, and resolves when a request
 * reaches it.
 */
const addHangingRoute = (app: Router) => {
  const started = Promise.withResolvers<void>();
  app.get('/hang', () => {
    started.resolve();
    return new Promise(() => {});
  });
  return started.promise;
};

describe('Function: serve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanUp);

  it('routes requests received on the address in AWS_LAMBDA_HTTP_ENDPOINT', async () => {
    // Prepare
    const app = new Router();
    app.get('/users/:id', ({ params }) => ({ id: params.id }));
    const baseUrl = await start(app);

    // Act
    const res = await fetch(`${baseUrl}/users/42`);

    // Assess
    expect(res.status).toBe(HttpStatusCodes.OK);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(await res.json()).toEqual({ id: '42' });
  });

  it('listens on 127.0.0.1:3000 when AWS_LAMBDA_HTTP_ENDPOINT is not set', async () => {
    // Prepare
    const listen = vi
      .spyOn(Server.prototype, 'listen')
      .mockImplementation(function (this: Server, ...args: unknown[]) {
        (args.at(-1) as () => void)();
        return this;
      });
    spies.push(listen);

    // Act
    await serve(new Router(), { shutdown: false });

    // Assess
    expect(listen).toHaveBeenCalledWith(
      3000,
      '127.0.0.1',
      expect.any(Function)
    );
  });

  it('rejects when the address is already in use', async () => {
    // Prepare
    const occupied = createServer();
    servers.push(occupied);
    occupied.listen(0, '127.0.0.1');
    await once(occupied, 'listening');
    const { port } = occupied.address() as AddressInfo;
    vi.stubEnv('AWS_LAMBDA_HTTP_ENDPOINT', `127.0.0.1:${port}`);

    // Act & Assess
    await expect(serve(new Router(), { shutdown: false })).rejects.toThrow(
      'EADDRINUSE'
    );
  });

  it('passes the request body to the handler', async () => {
    // Prepare
    const app = new Router();
    app.post('/echo', async ({ req }) => ({ received: await req.text() }));
    const baseUrl = await start(app);

    // Act
    const res = await fetch(`${baseUrl}/echo`, {
      method: 'POST',
      body: 'hello world',
    });

    // Assess
    expect(await res.json()).toEqual({ received: 'hello world' });
  });

  it('writes the status, headers, and every Set-Cookie header', async () => {
    // Prepare
    const app = new Router();
    const cookies = [
      'a=1; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/',
      'b=2; HttpOnly; Path=/',
    ];
    app.get('/login', () => ({
      statusCode: HttpStatusCodes.CREATED,
      headers: { 'x-custom': 'value' },
      body: 'ok',
      cookies,
    }));
    const baseUrl = await start(app);

    // Act
    const res = await fetch(`${baseUrl}/login`);

    // Assess
    expect(res.status).toBe(HttpStatusCodes.CREATED);
    expect(res.headers.get('x-custom')).toBe('value');
    expect(res.headers.getSetCookie()).toEqual(cookies);
    expect(await res.text()).toBe('ok');
  });

  it('ends responses that have no body', async () => {
    // Prepare
    const app = new Router();
    app.delete('/items/:id', () => new Response(null, { status: 204 }));
    const baseUrl = await start(app);

    // Act
    const res = await fetch(`${baseUrl}/items/1`, { method: 'DELETE' });

    // Assess
    expect(res.status).toBe(HttpStatusCodes.NO_CONTENT);
    expect(await res.text()).toBe('');
  });

  it('streams the response body as the handler produces it', async () => {
    // Prepare
    const app = new Router();
    const secondChunk = Promise.withResolvers<void>();
    app.get('/stream', () => {
      return new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode('first'));
          await secondChunk.promise;
          controller.enqueue(new TextEncoder().encode('second'));
          controller.close();
        },
      });
    });
    const baseUrl = await start(app);

    // Act
    const res = await fetch(`${baseUrl}/stream`);
    const reader = res.body?.getReader();
    const first = await reader?.read();
    secondChunk.resolve();
    const second = await reader?.read();

    // Assess
    expect(new TextDecoder().decode(first?.value)).toBe('first');
    expect(new TextDecoder().decode(second?.value)).toBe('second');
  });

  it('stops reading the response body while the client is not reading', async () => {
    // Prepare
    const app = new Router();
    const chunk = new Uint8Array(64 * 1024);
    let pulls = 0;
    app.get('/firehose', () => {
      return new ReadableStream(
        {
          pull(controller) {
            pulls++;
            controller.enqueue(chunk);
          },
        },
        { highWaterMark: 0 }
      );
    });
    const baseUrl = await start(app);
    const socket = await openRaw(
      baseUrl,
      'GET /firehose HTTP/1.1\r\nHost: localhost\r\n\r\n'
    );
    socket.pause();

    // Act
    await sleep(200);
    const pullsWhilePaused = pulls;
    await sleep(100);

    // Assess
    expect(pullsWhilePaused).toBeGreaterThan(0);
    expect(pulls - pullsWhilePaused).toBeLessThan(5);
    socket.destroy();
  });

  it('aborts the request signal when the client disconnects', async () => {
    // Prepare
    const app = new Router();
    const aborted = Promise.withResolvers<void>();
    app.get('/forever', ({ req }) => {
      req.signal.addEventListener('abort', () => aborted.resolve());
      return new ReadableStream({
        pull: (controller) =>
          sleep(10).then(() =>
            controller.enqueue(new TextEncoder().encode('tick'))
          ),
      });
    });
    const baseUrl = await start(app);
    const client = new AbortController();
    const res = await fetch(`${baseUrl}/forever`, { signal: client.signal });
    await res.body?.getReader().read();

    // Act
    client.abort();

    // Assess
    await expect(aborted.promise).resolves.toBeUndefined();
  });

  it('cancels the response stream without failing when the client disconnects', async () => {
    // Prepare
    const app = new Router();
    const cancelled = Promise.withResolvers<void>();
    app.get('/forever', () => {
      return new ReadableStream({
        pull: (controller) =>
          sleep(10).then(() =>
            controller.enqueue(new TextEncoder().encode('tick'))
          ),
        cancel() {
          cancelled.resolve();
          throw new Error('cancel failed');
        },
      });
    });
    const baseUrl = await start(app);
    const client = new AbortController();
    const res = await fetch(`${baseUrl}/forever`, { signal: client.signal });
    await res.body?.getReader().read();

    // Act
    client.abort();

    // Assess
    await cancelled.promise;
    await sleep(20);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('does not abort the request signal when the response completes', async () => {
    // Prepare
    const app = new Router();
    let signal: AbortSignal | undefined;
    app.get('/test', ({ req }) => {
      signal = req.signal;
      return { ok: true };
    });
    const baseUrl = await start(app);

    // Act
    const res = await fetch(`${baseUrl}/test`);
    await res.json();
    await sleep(20);

    // Assess
    expect(signal?.aborted).toBe(false);
  });

  it('responds with a 500 when the request cannot be converted', async () => {
    // Prepare
    const baseUrl = await start(new Router());

    // Act
    const response = await sendRaw(
      baseUrl,
      'GET / HTTP/1.1\r\nHost: not a host\r\nConnection: close\r\n\r\n'
    );

    // Assess
    expect(response).toMatch(/^HTTP\/1\.1 500/);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to serve request',
      expect.any(TypeError)
    );
  });

  it('closes the connection when the response fails after the headers were sent', async () => {
    // Prepare
    const app = new Router();
    app.get('/broken', () => {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('partial'));
          setTimeout(() => controller.error(new Error('stream failed')), 20);
        },
      });
    });
    const baseUrl = await start(app);

    // Act
    const res = await fetch(`${baseUrl}/broken`);

    // Assess
    expect(res.status).toBe(HttpStatusCodes.OK);
    await expect(res.text()).rejects.toThrow();
    await vi.waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        'Failed to serve request',
        expect.objectContaining({ message: 'stream failed' })
      )
    );
  });

  it.each([
    { proto: 'http', expected: 'http://' },
    { proto: undefined, expected: 'https://' },
  ])(
    'builds the request URL with the $expected protocol',
    async ({ proto, expected }) => {
      // Prepare
      const app = new Router();
      app.get('/url', ({ req }) => ({ url: req.url }));
      const baseUrl = await start(app);
      const { host } = new URL(baseUrl);

      // Act
      const res = await fetch(`${baseUrl}/url?q=1`, {
        headers: proto ? { 'x-forwarded-proto': proto } : {},
      });

      // Assess
      expect(await res.json()).toEqual({ url: `${expected}${host}/url?q=1` });
    }
  );

  it('builds the request URL with localhost when the request has no Host header', async () => {
    // Prepare
    const app = new Router();
    app.get('/url', ({ req }) => ({ url: req.url }));
    const baseUrl = await start(app);

    // Act
    const response = await sendRaw(baseUrl, 'GET /url HTTP/1.0\r\n\r\n');

    // Assess
    expect(response).toContain('{"url":"https://localhost/url"}');
  });

  it('binds decorated route handlers to the provided scope', async () => {
    // Prepare
    const app = new Router();
    class Lambda {
      public readonly greeting = 'hello';

      @app.get('/greet')
      public greet() {
        return { greeting: this.greeting };
      }
    }
    const baseUrl = await start(app, { scope: new Lambda() });

    // Act
    const res = await fetch(`${baseUrl}/greet`);

    // Assess
    expect(await res.json()).toEqual({ greeting: 'hello' });
  });

  it.each([
    { timeoutSeconds: 5, min: 4_000, max: 5_000 },
    { timeoutSeconds: undefined, min: 59_000, max: 60_000 },
  ])(
    'reports the remaining time of a $timeoutSeconds second timeout',
    async ({ timeoutSeconds, min, max }) => {
      // Prepare
      const app = new Router();
      app.get('/time', ({ context }) => ({
        remaining: context.getRemainingTimeInMillis(),
      }));
      const baseUrl = await start(app, { timeoutSeconds });

      // Act
      const res = await fetch(`${baseUrl}/time`);

      // Assess
      const { remaining } = (await res.json()) as { remaining: number };
      expect(remaining).toBeGreaterThanOrEqual(min);
      expect(remaining).toBeLessThanOrEqual(max);
    }
  );

  describe('request context', () => {
    it('uses the request ID that Lambda assigned', async () => {
      // Prepare
      const app = new Router();
      app.get('/id', ({ context }) => ({
        awsRequestId: context.awsRequestId,
        storeRequestId: globalThis.awslambda?.InvokeStore?.getRequestId(),
      }));
      const baseUrl = await start(app);

      // Act
      const res = await fetch(`${baseUrl}/id`, {
        headers: { 'lambda-web-request-id': 'REQ123' },
      });

      // Assess
      expect(await res.json()).toEqual({
        awsRequestId: 'REQ123',
        storeRequestId: 'REQ123',
      });
    });

    it('generates a request ID when Lambda did not assign one', async () => {
      // Prepare
      const app = new Router();
      app.get('/id', ({ context }) => ({ awsRequestId: context.awsRequestId }));
      const baseUrl = await start(app);

      // Act
      const res = await fetch(`${baseUrl}/id`);

      // Assess
      const { awsRequestId } = (await res.json()) as { awsRequestId: string };
      expect(awsRequestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('opts Powertools into keeping state per request', async () => {
      // Prepare
      const before = shouldUseInvokeStore();

      // Act
      await start(new Router());

      // Assess
      expect(before).toBe(false);
      expect(shouldUseInvokeStore()).toBe(true);
    });

    it.each([
      { description: 'no store exists yet', createStore: async () => {} },
      {
        description: 'a store that does not isolate requests already exists',
        createStore: async () => {
          // Like the AWS SDK does, without AWS_LAMBDA_MAX_CONCURRENCY
          await InvokeStore.getInstanceAsync();
        },
      },
    ])(
      'keeps the request IDs of concurrent requests apart when $description',
      async ({ createStore }) => {
        // Prepare
        await createStore();
        const app = new Router();
        app.get('/id', async () => {
          await sleep(20);
          return {
            requestId: globalThis.awslambda?.InvokeStore?.getRequestId(),
          };
        });
        const baseUrl = await start(app);

        // Act
        const responses = await Promise.all(
          ['REQ1', 'REQ2', 'REQ3'].map((id) =>
            fetch(`${baseUrl}/id`, { headers: { 'lambda-web-request-id': id } })
          )
        );

        // Assess
        expect(await Promise.all(responses.map((res) => res.json()))).toEqual([
          { requestId: 'REQ1' },
          { requestId: 'REQ2' },
          { requestId: 'REQ3' },
        ]);
      }
    );

    it('reuses the request context created by the Web Functions runtime', async () => {
      // Prepare
      const store = await InvokeStore.getInstanceAsync(true);
      const emit = Server.prototype.emit;
      const emitSpy = vi.spyOn(Server.prototype, 'emit');
      spies.push(emitSpy);
      emitSpy.mockImplementation(function (
        this: Server,
        event: string | symbol,
        ...args: unknown[]
      ) {
        if (event !== 'request') return emit.call(this, event, ...args);
        return store.run(
          { [InvokeStoreBase.PROTECTED_KEYS.REQUEST_ID]: 'FROM_RUNTIME' },
          () => emit.call(this, event, ...args)
        );
      });
      const app = new Router();
      app.get('/id', () => ({
        requestId: globalThis.awslambda?.InvokeStore?.getRequestId(),
      }));
      const baseUrl = await start(app);

      // Act
      const res = await fetch(`${baseUrl}/id`, {
        headers: { 'lambda-web-request-id': 'FROM_HEADER' },
      });

      // Assess
      expect(await res.json()).toEqual({ requestId: 'FROM_RUNTIME' });
    });
  });
});

describe('Class: RequestScopedStore', () => {
  it('scopes values to the context of the current run', () => {
    // Prepare
    const store = new RequestScopedStore();

    // Act
    const inside = store.run({}, () => {
      store.set('key', 'value');
      return { value: store.get('key'), hasContext: store.hasContext() };
    });

    // Assess
    expect(inside).toEqual({ value: 'value', hasContext: true });
    expect(store.hasContext()).toBe(false);
    expect(store.getContext()).toBeUndefined();
    expect(store.get('key')).toBeUndefined();
  });

  it('throws when setting a value outside of a run', () => {
    // Prepare
    const store = new RequestScopedStore();

    // Act & Assess
    expect(() => store.set('key', 'value')).toThrow('No context available');
  });

  it('throws when setting a protected key', () => {
    // Prepare
    const store = new RequestScopedStore();

    // Act & Assess
    expect(() =>
      store.run({}, () =>
        store.set(InvokeStoreBase.PROTECTED_KEYS.REQUEST_ID, 'REQ123')
      )
    ).toThrow('Cannot modify protected Lambda context field');
  });
});

describe('Function: createContext', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds the context from the environment', () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'my-web-function');
    vi.stubEnv('AWS_LAMBDA_FUNCTION_VERSION', 'rev-abc12');
    vi.stubEnv('AWS_LAMBDA_FUNCTION_MEMORY_SIZE', '1024');
    vi.stubEnv('AWS_LAMBDA_LOG_GROUP_NAME', '/aws/lambda/web/my-web-function');
    vi.stubEnv('AWS_LAMBDA_LOG_STREAM_NAME', 'stream');

    // Act
    const context = createContext('REQ123', 30_000);

    // Assess
    expect(context).toEqual(
      expect.objectContaining({
        awsRequestId: 'REQ123',
        functionName: 'my-web-function',
        functionVersion: 'rev-abc12',
        memoryLimitInMB: '1024',
        logGroupName: '/aws/lambda/web/my-web-function',
        logStreamName: 'stream',
        invokedFunctionArn: '',
        callbackWaitsForEmptyEventLoop: false,
      })
    );
  });

  it('falls back to defaults for values missing from the environment', () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', undefined);
    vi.stubEnv('AWS_LAMBDA_FUNCTION_MEMORY_SIZE', undefined);

    // Act
    const context = createContext('REQ123', 30_000);

    // Assess
    expect(context).toEqual(
      expect.objectContaining({
        functionName: '',
        functionVersion: '',
        memoryLimitInMB: '2048',
        logGroupName: '',
        logStreamName: '',
      })
    );
  });

  it.each([
    { timeoutMs: 30_000, min: 29_000, max: 30_000 },
    { timeoutMs: 0, min: 0, max: 0 },
  ])(
    'reports the remaining time of a $timeoutMs ms timeout',
    ({ timeoutMs, min, max }) => {
      // Act
      const context = createContext('REQ123', timeoutMs);

      // Assess
      const remaining = context.getRemainingTimeInMillis();
      expect(remaining).toBeGreaterThanOrEqual(min);
      expect(remaining).toBeLessThanOrEqual(max);
    }
  );

  it('provides callback methods that do nothing', () => {
    // Prepare
    const context = createContext('REQ123', 30_000);

    // Act & Assess
    expect(context.done()).toBeUndefined();
    expect(context.fail('error')).toBeUndefined();
    expect(context.succeed('result')).toBeUndefined();
  });
});

describe('Function: serve - shutdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanUp);

  it('does not handle SIGTERM when shutdown is false', async () => {
    // Prepare
    const listeners = captureShutdownListener();

    // Act
    await start(new Router(), { shutdown: false });

    // Assess
    expect(listeners).toHaveLength(0);
  });

  it('stops accepting connections on SIGTERM without exiting the process', async () => {
    // Prepare
    const listeners = captureShutdownListener();
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    spies.push(exit);
    vi.stubEnv('AWS_LAMBDA_HTTP_ENDPOINT', '127.0.0.1:0');
    const server = await serve(new Router());
    servers.push(server);

    // Act
    await listeners[0]();

    // Assess
    expect(server.listening).toBe(false);
    expect(exit).not.toHaveBeenCalled();
  });

  it('runs onShutdown right away when no request is in flight', async () => {
    // Prepare
    const listeners = captureShutdownListener();
    const onShutdown = vi.fn();
    await start(new Router(), { shutdown: { onShutdown } });
    const startedAt = performance.now();

    // Act
    await listeners[0]();

    // Assess
    expect(onShutdown).toHaveBeenCalledOnce();
    expect(performance.now() - startedAt).toBeLessThan(100);
  });

  it('runs onShutdown after the in-flight requests finish', async () => {
    // Prepare
    const listeners = captureShutdownListener();
    const order: string[] = [];
    const started = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const app = new Router();
    app.get('/slow', async () => {
      started.resolve();
      await release.promise;
      order.push('request');
      return { ok: true };
    });
    const baseUrl = await start(app, {
      shutdown: {
        timeoutMs: 5_000,
        onShutdown: () => {
          order.push('shutdown');
        },
      },
    });
    const pending = fetch(`${baseUrl}/slow`);
    await started.promise;

    // Act
    const shutdown = listeners[0]();
    release.resolve();
    const res = await pending;
    await shutdown;

    // Assess
    expect(res.status).toBe(HttpStatusCodes.OK);
    expect(order).toEqual(['request', 'shutdown']);
  });

  it.each([
    { timeoutMs: 50, min: 40, max: 400 },
    { timeoutMs: undefined, min: 450, max: 1_000 },
  ])(
    'runs onShutdown after $timeoutMs ms when requests are still in flight',
    async ({ timeoutMs, min, max }) => {
      // Prepare
      const listeners = captureShutdownListener();
      const onShutdown = vi.fn();
      const app = new Router();
      const started = addHangingRoute(app);
      const baseUrl = await start(app, { shutdown: { timeoutMs, onShutdown } });
      fetch(`${baseUrl}/hang`).catch(() => {});
      await started;
      const startedAt = performance.now();

      // Act
      await listeners[0]();

      // Assess
      const elapsed = performance.now() - startedAt;
      expect(onShutdown).toHaveBeenCalledOnce();
      expect(elapsed).toBeGreaterThanOrEqual(min);
      expect(elapsed).toBeLessThan(max);
    }
  );

  it('closes the connections still open after onShutdown', async () => {
    // Prepare
    const listeners = captureShutdownListener();
    const app = new Router();
    const started = addHangingRoute(app);
    const baseUrl = await start(app, { shutdown: { timeoutMs: 20 } });
    const pending = fetch(`${baseUrl}/hang`);
    await started;

    // Act
    await listeners[0]();

    // Assess
    await expect(pending).rejects.toThrow();
  });

  it('logs an error when onShutdown fails', async () => {
    // Prepare
    const listeners = captureShutdownListener();
    const error = new Error('flush failed');
    await start(new Router(), {
      shutdown: {
        onShutdown: async () => {
          throw error;
        },
      },
    });

    // Act
    await listeners[0]();

    // Assess
    expect(console.error).toHaveBeenCalledWith('Shutdown hook failed', error);
  });
});
