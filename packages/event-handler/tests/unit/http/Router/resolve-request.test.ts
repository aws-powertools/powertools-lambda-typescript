import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestError,
  HttpStatusCodes,
  Router,
} from '../../../../src/http/index.js';
import type { RequestContext } from '../../../../src/types/http.js';

const BASE_URL = 'https://abc123.lambda-web.eu-west-1.on.aws';

describe('Class: Router - resolveRequest', () => {
  it('routes a Web Request to its handler and returns a Web Response', async () => {
    // Prepare
    const app = new Router();
    app.get('/users/:id', ({ params, req }) => ({
      id: params.id,
      sort: new URL(req.url).searchParams.get('sort'),
    }));

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/users/42?sort=asc`),
      context
    );

    // Assess
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(HttpStatusCodes.OK);
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(await res.json()).toEqual({ id: '42', sort: 'asc' });
  });

  it('exposes the request body through the Web Request', async () => {
    // Prepare
    const app = new Router();
    app.post('/echo', async ({ req }) => ({
      received: (await req.json()) as JSONValue,
    }));

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/echo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hello: 'world' }),
      }),
      context
    );

    // Assess
    expect(await res.json()).toEqual({ received: { hello: 'world' } });
  });

  it('matches a route when the request method is lowercase', async () => {
    // Prepare
    const app = new Router();
    app.patch('/items', () => ({ patched: true }));

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/items`, { method: 'patch', body: '{}' }),
      context
    );

    // Assess
    expect(res.status).toBe(HttpStatusCodes.OK);
    expect(await res.json()).toEqual({ patched: true });
  });

  it('returns a 405 response for an unsupported HTTP method', async () => {
    // Prepare
    const app = new Router();
    app.get('/items', () => ({ ok: true }));

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/items`, { method: 'PROPFIND' }),
      context
    );

    // Assess
    expect(res.status).toBe(HttpStatusCodes.METHOD_NOT_ALLOWED);
    expect(res.body).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'InvalidHttpMethodError' })
    );
  });

  it('returns a 404 response when no route matches', async () => {
    // Prepare
    const app = new Router();

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/missing`),
      context
    );

    // Assess
    expect(res.status).toBe(HttpStatusCodes.NOT_FOUND);
    expect(await res.json()).toEqual({
      statusCode: HttpStatusCodes.NOT_FOUND,
      error: 'NotFoundError',
      message: 'Route /missing for method GET not found',
    });
  });

  it('converts errors thrown by the handler into error responses', async () => {
    // Prepare
    const app = new Router();
    app.get('/bad', () => {
      throw new BadRequestError('Invalid input');
    });

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/bad`),
      context
    );

    // Assess
    expect(res.status).toBe(HttpStatusCodes.BAD_REQUEST);
    expect(await res.json()).toEqual({
      statusCode: HttpStatusCodes.BAD_REQUEST,
      error: 'BadRequestError',
      message: 'Invalid input',
    });
  });

  it('streams a ReadableStream body as the handler produces it', async () => {
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

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/stream`),
      context
    );
    const reader = res.body?.getReader();
    const first = await reader?.read();
    secondChunk.resolve();
    const second = await reader?.read();

    // Assess
    expect(new TextDecoder().decode(first?.value)).toBe('first');
    expect(new TextDecoder().decode(second?.value)).toBe('second');
  });

  it('returns binary bodies as raw bytes', async () => {
    // Prepare
    const app = new Router();
    const bytes = new Uint8Array([0, 1, 254, 255]);
    app.get('/binary', () => bytes.buffer);

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/binary`),
      context
    );

    // Assess
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
  });

  it('decodes a base64 encoded proxy result body', async () => {
    // Prepare
    const app = new Router();
    app.get('/image', () => ({
      statusCode: 200,
      headers: { 'content-type': 'image/png' },
      body: Buffer.from('png-bytes').toString('base64'),
      isBase64Encoded: true,
    }));

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/image`),
      context
    );

    // Assess
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('png-bytes');
  });

  it('keeps every Set-Cookie header of the response', async () => {
    // Prepare
    const app = new Router();
    const cookies = [
      'a=1; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/',
      'b=2; HttpOnly; Path=/',
    ];
    app.get('/login', () => ({ statusCode: 200, body: 'ok', cookies }));

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/login`),
      context
    );

    // Assess
    expect(res.headers.getSetCookie()).toEqual(cookies);
  });

  it('runs middleware with the request context of a Web Request', async () => {
    // Prepare
    const app = new Router();
    const seen = vi.fn();
    app.use(async ({ reqCtx, next }) => {
      seen(reqCtx.responseType, reqCtx.context, reqCtx.req.headers.get('x-id'));
      await next();
    });
    app.get('/test', () => ({ ok: true }));

    // Act
    await app.resolveRequest(
      new Request(`${BASE_URL}/test`, { headers: { 'x-id': 'abc' } }),
      context
    );

    // Assess
    expect(seen).toHaveBeenCalledWith('WebFunction', context, 'abc');
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
    const lambda = new Lambda();

    // Act
    const res = await app.resolveRequest(
      new Request(`${BASE_URL}/greet`),
      context,
      { scope: lambda }
    );

    // Assess
    expect(await res.json()).toEqual({ greeting: 'hello' });
  });

  describe('event view', () => {
    const captureEvent = async (request: Request) => {
      const app = new Router();
      let event: RequestContext['event'] | undefined;
      app.route(
        (reqCtx) => {
          event = reqCtx.event;
          return { ok: true };
        },
        { method: ['GET', 'POST'], path: '/test' }
      );
      await app.resolveRequest(request, context);
      return event;
    };

    it('exposes the request headers with lowercase names', async () => {
      // Prepare
      const headers = new Headers({ 'X-Custom': 'value' });
      headers.append('Accept', 'text/html');
      headers.append('Accept', 'application/json');

      // Act
      const event = await captureEvent(
        new Request(`${BASE_URL}/test`, { headers })
      );

      // Assess
      expect(event?.headers).toEqual({
        'x-custom': 'value',
        accept: 'text/html, application/json',
      });
    });

    it('joins repeated query string parameters with a comma', async () => {
      // Act
      const event = await captureEvent(
        new Request(`${BASE_URL}/test?tag=a&tag=b&page=2&constructor=x`)
      );

      // Assess
      expect(event?.queryStringParameters).toEqual({
        tag: 'a,b',
        page: '2',
        constructor: 'x',
      });
    });

    it('sets query string parameters to undefined when there are none', async () => {
      // Act
      const event = await captureEvent(new Request(`${BASE_URL}/test`));

      // Assess
      expect(event?.queryStringParameters).toBeUndefined();
    });

    it('exposes no body, request context, or base64 encoding', async () => {
      // Act
      const event = await captureEvent(
        new Request(`${BASE_URL}/test`, { method: 'POST', body: 'payload' })
      );

      // Assess
      expect(event?.body).toBeUndefined();
      expect(event?.isBase64Encoded).toBe(false);
      expect(event?.requestContext).toEqual({});
    });

    it('returns the same event on every access', async () => {
      // Prepare
      const app = new Router();
      let sameEvent: boolean | undefined;
      app.get('/test', (reqCtx) => {
        const first = reqCtx.event;
        sameEvent = first === reqCtx.event;
        return { ok: true };
      });

      // Act
      await app.resolveRequest(new Request(`${BASE_URL}/test`), context);

      // Assess
      expect(sameEvent).toBe(true);
    });

    it('builds the event view when it is first read', async () => {
      // Prepare
      const app = new Router();
      let headers: unknown;
      app.use(async ({ reqCtx, next }) => {
        reqCtx.req.headers.set('x-added-by', 'middleware');
        await next();
      });
      app.get('/test', ({ event }) => {
        headers = event.headers;
        return { ok: true };
      });

      // Act
      await app.resolveRequest(new Request(`${BASE_URL}/test`), context);

      // Assess
      expect(headers).toEqual({ 'x-added-by': 'middleware' });
    });

    it('replaces the event view when a middleware assigns one', async () => {
      // Prepare
      const app = new Router();
      let tenant: string | undefined;
      app.use(async ({ reqCtx, next }) => {
        reqCtx.event = {
          ...reqCtx.event,
          headers: { ...reqCtx.event.headers, 'x-tenant': 'acme' },
        };
        await next();
      });
      app.get('/test', ({ event }) => {
        tenant = event.headers?.['x-tenant'];
        return { ok: true };
      });

      // Act
      const res = await app.resolveRequest(
        new Request(`${BASE_URL}/test`),
        context
      );

      // Assess
      expect(res.status).toBe(HttpStatusCodes.OK);
      expect(tenant).toBe('acme');
    });

    it('passes the event view to error handlers', async () => {
      // Prepare
      const app = new Router();
      app.errorHandler(BadRequestError, async (error, reqCtx) => ({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: error.message,
        userAgent: reqCtx.event.headers?.['user-agent'],
      }));
      app.get('/bad', () => {
        throw new BadRequestError('nope');
      });

      // Act
      const res = await app.resolveRequest(
        new Request(`${BASE_URL}/bad`, { headers: { 'user-agent': 'ua/1' } }),
        context
      );

      // Assess
      expect(await res.json()).toEqual({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        message: 'nope',
        userAgent: 'ua/1',
      });
    });
  });
});
