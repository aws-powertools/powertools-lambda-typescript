import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type streamWeb from 'node:stream/web';
import { InvokeStore, InvokeStoreBase } from '@aws/lambda-invoke-store';
import {
  enableInvokeStore,
  getStringFromEnv,
} from '@aws-lambda-powertools/commons/utils/env';
import type { Context } from 'aws-lambda';
import type {
  Env,
  WebFunctionServeOptions,
  WebFunctionShutdownOptions,
} from '../../types/http.js';
import { WEB_FUNCTION_DEFAULTS } from '../constants.js';
import { webHeadersToApiGatewayHeaders } from '../converters.js';
import type { Router } from '../Router.js';

/**
 * Values stored in a request's InvokeStore context.
 */
type RequestStoreContext = Record<string | symbol, unknown>;

/**
 * InvokeStore that keeps the context of each request in its own
 * `AsyncLocalStorage` slot.
 *
 * Used when the store that already exists in the process doesn't isolate
 * concurrent requests, for example one that the AWS SDK created before
 * {@link serve | `serve()`} ran locally.
 */
class RequestScopedStore extends InvokeStoreBase {
  readonly #storage = new AsyncLocalStorage<RequestStoreContext>();

  public getContext(): RequestStoreContext | undefined {
    return this.#storage.getStore();
  }

  public hasContext(): boolean {
    return this.#storage.getStore() !== undefined;
  }

  public get<T = unknown>(key: string | symbol): T | undefined {
    return this.#storage.getStore()?.[key] as T | undefined;
  }

  public set<T = unknown>(key: string | symbol, value: T): void {
    if (this.isProtectedKey(key)) {
      throw new Error(
        `Cannot modify protected Lambda context field: ${String(key)}`
      );
    }
    const context = this.#storage.getStore();
    if (context === undefined) {
      throw new Error('No context available');
    }
    context[key] = value;
  }

  public run<T>(context: RequestStoreContext, fn: () => T): T {
    return this.#storage.run(context, fn);
  }
}

/**
 * Checks whether a store keeps the contexts of concurrent requests apart, by
 * looking for a context that outlives the `run()` call that set it.
 *
 * @param store - The store to check
 */
const isRequestScoped = (store: InvokeStoreBase): boolean => {
  const probe: RequestStoreContext = {};
  store.run(probe, () => undefined);
  return store.getContext() !== probe;
};

/**
 * Creates the Lambda context for a single request.
 *
 * Web Functions don't pass a context to your code, so this builds one from the
 * environment and the request, letting handlers, middleware, and Logger's
 * `addContext()` work unchanged.
 *
 * @param requestId - The request ID that Lambda assigned to the request
 * @param timeoutMs - The request timeout, used for `getRemainingTimeInMillis()`
 */
const createContext = (requestId: string, timeoutMs: number): Context => {
  const deadline = Date.now() + timeoutMs;
  const noop = () => undefined;
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: getStringFromEnv({
      key: 'AWS_LAMBDA_FUNCTION_NAME',
      defaultValue: '',
    }),
    functionVersion: getStringFromEnv({
      key: 'AWS_LAMBDA_FUNCTION_VERSION',
      defaultValue: '',
    }),
    invokedFunctionArn: '',
    memoryLimitInMB: getStringFromEnv({
      key: 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE',
      defaultValue: WEB_FUNCTION_DEFAULTS.MEMORY_SIZE,
    }),
    awsRequestId: requestId,
    logGroupName: getStringFromEnv({
      key: 'AWS_LAMBDA_LOG_GROUP_NAME',
      defaultValue: '',
    }),
    logStreamName: getStringFromEnv({
      key: 'AWS_LAMBDA_LOG_STREAM_NAME',
      defaultValue: '',
    }),
    getRemainingTimeInMillis: () => Math.max(0, deadline - Date.now()),
    done: noop,
    fail: noop,
    succeed: noop,
  };
};

/**
 * Converts a Node.js request to a Web Request without buffering the body.
 *
 * @param req - The incoming Node.js request
 * @param signal - Aborted when the client disconnects
 */
const toWebRequest = (req: IncomingMessage, signal: AbortSignal): Request => {
  const headers = new Headers();
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    headers.append(req.rawHeaders[i], req.rawHeaders[i + 1]);
  }
  // Lambda terminates TLS at the endpoint, which only serves HTTPS.
  const protocol = headers.get('X-Forwarded-Proto') ?? 'https';
  const host = headers.get('Host') ?? 'localhost';
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  return new Request(`${protocol}://${host}${req.url}`, {
    method: req.method,
    headers,
    signal,
    ...(hasBody && { body: req, duplex: 'half' }),
  });
};

/**
 * Writes a Web Response to a Node.js response, streaming the body with
 * backpressure.
 *
 * A client that disconnects mid-response ends the write without an error.
 *
 * @param response - The Web Response returned by the router
 * @param res - The outgoing Node.js response
 */
const writeWebResponse = async (
  response: Response,
  res: ServerResponse
): Promise<void> => {
  const { headers, cookies } = webHeadersToApiGatewayHeaders(
    response.headers,
    'ApiGatewayV2'
  );
  res.writeHead(
    response.status,
    cookies === undefined ? headers : { ...headers, 'set-cookie': cookies }
  );

  if (response.body === null) {
    res.end();
    return;
  }

  try {
    await pipeline(
      Readable.fromWeb(response.body as streamWeb.ReadableStream),
      res
    );
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === 'ERR_STREAM_PREMATURE_CLOSE'
    ) {
      return;
    }
    throw error;
  }
};

/**
 * Gets the InvokeStore that isolates concurrent requests and turns on
 * per-request scoping in Powertools utilities.
 *
 * On a Web Function the runtime has already created an isolating store and
 * this returns it. When running locally the store is created here, with
 * isolation forced. If a store that doesn't isolate requests already exists,
 * for example because the AWS SDK created one, it's replaced for Powertools
 * with a {@link RequestScopedStore | `RequestScopedStore`}. Scoping is only
 * enabled once an isolating store is in place, so that no utility ever reads
 * scoped state while the store is missing.
 */
const getRequestStore = async (): Promise<InvokeStoreBase> => {
  let store = await InvokeStore.getInstanceAsync(true);
  if (!isRequestScoped(store)) {
    store = new RequestScopedStore();
    globalThis.awslambda.InvokeStore = store;
  }
  enableInvokeStore();
  return store;
};

/**
 * Closes the server on `SIGTERM`, waits for in-flight requests, and runs the
 * shutdown hook.
 *
 * Lambda sends `SIGTERM` before removing an execution environment and kills the
 * process about one second later. The process isn't exited explicitly, so that
 * pending log writes are flushed and other `SIGTERM` listeners still run; it
 * ends once nothing keeps the event loop alive, or when Lambda kills it.
 *
 * @param server - The server to close
 * @param waitUntilIdle - Returns a promise that settles when no request is in flight
 * @param options - The shutdown options
 */
const handleShutdown = (
  server: Server,
  waitUntilIdle: () => Promise<void>,
  options: WebFunctionShutdownOptions
): void => {
  const timeoutMs =
    options.timeoutMs ?? WEB_FUNCTION_DEFAULTS.SHUTDOWN_TIMEOUT_MS;
  process.once('SIGTERM', async () => {
    server.close();
    server.closeIdleConnections();
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([
      waitUntilIdle(),
      new Promise((resolve) => {
        timer = setTimeout(resolve, timeoutMs);
      }),
    ]);
    clearTimeout(timer);
    try {
      await options.onShutdown?.();
    } catch (error) {
      console.error('Shutdown hook failed', error);
    }
    server.closeAllConnections();
  });
};

/**
 * Starts an HTTP server that serves a {@link Router | `Router`} as a Lambda
 * Web Function.
 *
 * The server listens on the address in `AWS_LAMBDA_HTTP_ENDPOINT` (or
 * `127.0.0.1:3000` when running locally) and, for each request:
 *
 * - keeps Powertools state (Logger keys, Metrics, ...) scoped to the request,
 *   even though many requests share one execution environment. On a Web
 *   Function the runtime already runs each request in its own InvokeStore
 *   context; locally the server does the same, so behavior matches
 * - creates a Lambda {@link Context | `Context`} whose `awsRequestId` is the
 *   `lambda-web-request-id` that Lambda assigned
 * - routes the request with {@link Router.resolveRequest | `resolveRequest()`},
 *   streaming the response body as the handler produces it
 *
 * On `SIGTERM` it stops accepting connections, waits up to
 * `shutdown.timeoutMs` for in-flight requests, and runs `shutdown.onShutdown`.
 * Pass `shutdown: false` to handle `SIGTERM` yourself.
 *
 * @example
 * ```typescript
 * import { Router } from '@aws-lambda-powertools/event-handler/http';
 * import { serve } from '@aws-lambda-powertools/event-handler/http/web-function';
 *
 * const app = new Router();
 * app.get('/hello', () => ({ message: 'hello' }));
 *
 * await serve(app, {
 *   shutdown: { onShutdown: async () => pool.end() },
 * });
 * ```
 *
 * @param app - The router to serve
 * @param options - Options for the server
 */
const serve = async <TEnv extends Env>(
  app: Router<TEnv>,
  options?: WebFunctionServeOptions
): Promise<Server> => {
  const timeoutMs =
    (options?.timeoutSeconds ?? WEB_FUNCTION_DEFAULTS.TIMEOUT_SECONDS) * 1000;
  const store = await getRequestStore();
  const { REQUEST_ID } = InvokeStoreBase.PROTECTED_KEYS;

  let inFlight = 0;
  let onIdle: (() => void) | undefined;
  const waitUntilIdle = () =>
    inFlight === 0
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          onIdle = resolve;
        });

  const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    const requestId =
      req.headers['lambda-web-request-id']?.toString() ?? randomUUID();
    const abortController = new AbortController();
    res.once('close', () => {
      if (!res.writableFinished) abortController.abort();
    });

    const respond = async () => {
      const response = await app.resolveRequest(
        toWebRequest(req, abortController.signal),
        createContext(requestId, timeoutMs),
        { scope: options?.scope }
      );
      await writeWebResponse(response, res);
    };

    // The Web Function runtime already runs each request in its own context.
    if (store.hasContext()) {
      return respond();
    }
    return store.run({ [REQUEST_ID]: requestId }, respond);
  };

  const server = createServer((req, res) => {
    inFlight++;
    res.once('close', () => {
      inFlight--;
      if (inFlight === 0) onIdle?.();
    });
    handleRequest(req, res).catch((error) => {
      console.error('Failed to serve request', error);
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.writeHead(500).end();
    });
  });

  if (options?.shutdown !== false) {
    handleShutdown(server, waitUntilIdle, options?.shutdown ?? {});
  }

  const endpoint = getStringFromEnv({
    key: 'AWS_LAMBDA_HTTP_ENDPOINT',
    defaultValue: WEB_FUNCTION_DEFAULTS.ENDPOINT,
  });
  const separator = endpoint.lastIndexOf(':');
  const host = endpoint.slice(0, separator);
  const port = Number(endpoint.slice(separator + 1));

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return server;
};

export { createContext, RequestScopedStore, serve };
