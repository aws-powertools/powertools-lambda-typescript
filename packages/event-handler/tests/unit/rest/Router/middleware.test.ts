import { Readable } from 'node:stream';
import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { HttpStatusCodes, Router } from '../../../../src/rest/index.js';
import type {
  Middleware,
  Path,
  RequestContext,
} from '../../../../src/types/rest.js';
import {
  createNoNextMiddleware,
  createReturningMiddleware,
  createTestEvent,
  createTestEventV2,
  createThrowingMiddleware,
  createTrackingMiddleware,
} from '../helpers.js';

describe('Class: Router - Middleware', () => {
  it.each([
    {
      path: '/auth',
      middlewareNames: ['auth-middleware'],
      expectedOrder: ['global-middleware', 'auth-middleware', 'handler'],
    },
    {
      path: '/admin',
      middlewareNames: ['auth-middleware', 'admin-middleware'],
      expectedOrder: [
        'global-middleware',
        'auth-middleware',
        'admin-middleware',
        'handler',
      ],
    },
    {
      path: '/public',
      middlewareNames: [],
      expectedOrder: ['global-middleware', 'handler'],
    },
  ])(
    'different routes can have different middleware: $path',
    async ({ path, middlewareNames, expectedOrder }) => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(async ({ next }) => {
        executionOrder.push('global-middleware');
        await next();
      });

      const middleware: Middleware[] = middlewareNames.map(
        (name) =>
          async ({ next }) => {
            executionOrder.push(name);
            await next();
          }
      );

      app.get(path as Path, middleware, () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      await app.resolve(createTestEvent(path, 'GET'), context);

      // Assess
      expect(executionOrder).toEqual(expectedOrder);
    }
  );

  describe('middleware - global', () => {
    it('executes middleware in order before route handler', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('middleware1', executionOrder));
      app.use(createTrackingMiddleware('middleware2', executionOrder));

      app.get('/test', () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(executionOrder).toEqual([
        'middleware1-start',
        'middleware2-start',
        'handler',
        'middleware2-end',
        'middleware1-end',
      ]);
    });

    it('allows middleware to short-circuit by returning Response', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('middleware1', executionOrder));
      app.use(
        createReturningMiddleware(
          'middleware2',
          executionOrder,
          new Response('Short-circuited', { status: 401 })
        )
      );

      app.get('/test', () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual([
        'middleware1-start',
        'middleware2',
        'middleware1-end',
      ]);
      expect(result.statusCode).toBe(401);
      expect(result.body).toBe('Short-circuited');
    });

    it('passes params and options to middleware', async () => {
      // Prepare
      const app = new Router();
      let middlewareParams: Record<string, string> | undefined;
      let middlewareOptions: RequestContext | undefined;

      app.use(async ({ reqCtx, next }) => {
        middlewareParams = reqCtx.params;
        middlewareOptions = reqCtx;
        await next();
      });

      app.get('/test/:id', async () => ({ success: true }));

      // Act
      const testEvent = createTestEvent('/test/123', 'GET');
      await app.resolve(testEvent, context);

      // Assess
      expect(middlewareParams).toEqual({ id: '123' });
      expect(middlewareOptions?.event).toBe(testEvent);
      expect(middlewareOptions?.context).toBe(context);
      expect(middlewareOptions?.req).toBeInstanceOf(Request);
    });

    it('returns error response when next() is called multiple times', async () => {
      // Prepare
      vi.stubEnv('POWERTOOLS_DEV', 'true');
      const app = new Router();

      app.use(async ({ next }) => {
        await next();
        await next();
      });

      app.get('/test', async () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('next() called multiple times');
    });

    it('should throw error if middleware does not await next()', async () => {
      // Prepare
      vi.stubEnv('POWERTOOLS_DEV', 'true');
      const app = new Router();

      app.use(async ({ next }) => {
        await next();
      });

      // biome-ignore lint/suspicious/useAwait: This specifically tests a missing await call in an async function
      app.use(async ({ next }) => {
        next();
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'OPTIONS'),
        context
      );

      // Assess
      const body = JSON.parse(result.body);
      expect(body.message).toEqual(
        'Middleware called next() without awaiting. This may lead to unexpected behavior.'
      );
    });

    it('handles errors thrown in middleware before next()', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(
        createThrowingMiddleware(
          'middleware1',
          executionOrder,
          'Middleware error'
        )
      );
      app.use(createTrackingMiddleware('middleware2', executionOrder));

      app.get('/test', () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual(['middleware1']);
      expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles errors thrown in middleware after next()', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(async ({ next }) => {
        executionOrder.push('middleware1-start');
        await next();
        executionOrder.push('middleware1-end');
        throw new Error('Cleanup error');
      });

      app.get('/test', () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual([
        'middleware1-start',
        'handler',
        'middleware1-end',
      ]);
      expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('propagates handler errors through middleware chain', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('middleware1', executionOrder));
      app.use(createTrackingMiddleware('middleware2', executionOrder));

      app.get('/test', () => {
        executionOrder.push('handler');
        throw new Error('Handler error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual([
        'middleware1-start',
        'middleware2-start',
        'handler',
      ]);
      expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles middleware not calling next()', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createNoNextMiddleware('middleware1', executionOrder));
      app.use(createTrackingMiddleware('middleware2', executionOrder));

      app.get('/test', () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual(['middleware1']);
      expect(result.statusCode).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles middleware returning JSON objects', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('middleware1', executionOrder));
      app.use(
        createReturningMiddleware('middleware2', executionOrder, {
          statusCode: 202,
          message: 'Accepted by middleware',
        })
      );

      app.get('/test', () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual([
        'middleware1-start',
        'middleware2',
        'middleware1-end',
      ]);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body).toEqual({
        statusCode: 202,
        message: 'Accepted by middleware',
      });
    });

    it('allows middleware to manipulate response headers', async () => {
      // Prepare
      const app = new Router();

      app.use(async ({ reqCtx, next }) => {
        await next();
        reqCtx.res.headers.set('x-custom-header', 'middleware-value');
        reqCtx.res.headers.set('x-request-id', '12345');
      });

      app.get('/test', () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: {
          'content-type': 'application/json',
          'x-custom-header': 'middleware-value',
          'x-request-id': '12345',
        },
        isBase64Encoded: false,
      });
    });

    it('allows middleware to completely overwrite response', async () => {
      // Prepare
      const app = new Router();

      app.use(async ({ reqCtx, next }) => {
        await next();
        const originalBody = await reqCtx.res.text();
        reqCtx.res = new Response(`Modified: ${originalBody}`, {
          headers: { 'content-type': 'text/plain' },
        });
      });

      app.get('/test', async () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: 200,
        body: 'Modified: {"success":true}',
        headers: { 'content-type': 'text/plain' },
        isBase64Encoded: false,
      });
    });

    it('preserves headers set before calling next()', async () => {
      // Prepare
      const app = new Router();

      app.use(async ({ reqCtx, next }) => {
        reqCtx.res.headers.set('x-before-handler', 'middleware-value');
        await next();
      });

      app.get('/test', async () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: {
          'content-type': 'application/json',
          'x-before-handler': 'middleware-value',
        },
        isBase64Encoded: false,
      });
    });

    it('headers set by handler before next() take precedence', async () => {
      // Prepare
      const app = new Router();

      app.use(async ({ reqCtx, next }) => {
        reqCtx.res.headers.set('x-before-handler', 'middleware-value');
        await next();
      });

      app.get('/handler-precedence', () => {
        const response = Response.json({ success: true });
        response.headers.set('x-before-handler', 'handler-value');
        return response;
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/handler-precedence', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(200);
      expect(result.headers?.['content-type']).toBe('application/json');
      expect(result.headers?.['x-before-handler']).toBe('handler-value');
    });

    it('overwrites headers when set later in the middleware stack', async () => {
      // Prepare
      const app = new Router();

      app.use(async ({ reqCtx, next }) => {
        reqCtx.res.headers.set('x-test-header', 'before-next');
        await next();
      });

      app.use(async ({ reqCtx, next }) => {
        await next();
        reqCtx.res.headers.set('x-test-header', 'after-next');
      });

      app.get('/test', async () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: {
          'content-type': 'application/json',
          'x-test-header': 'after-next',
        },
        isBase64Encoded: false,
      });
    });

    it('executes global middleware even when route is not found', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      const globalMiddleware = createTrackingMiddleware(
        'global',
        executionOrder
      );
      app.use(globalMiddleware);

      // Act
      await app.resolve(createTestEvent('/nonexistent', 'GET'), context);

      // Assess
      expect(executionOrder).toEqual(['global-start', 'global-end']);
    });

    it('works with class decorators and preserves scope access', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(async ({ next }) => {
        executionOrder.push('middleware-start');
        await next();
        executionOrder.push('middleware-end');
      });

      class Lambda {
        public scope = 'class-scope';

        @app.get('/test')
        public getTest() {
          executionOrder.push('handler');
          return { message: `${this.scope}: success` };
        }

        public handler(event: unknown, _context: Context) {
          return app.resolve(event, _context, { scope: this });
        }
      }

      const lambda = new Lambda();

      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(executionOrder).toEqual([
        'middleware-start',
        'handler',
        'middleware-end',
      ]);
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({ message: 'class-scope: success' }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('handles middleware returning ExtendedAPIGatewayProxyResult with node stream body', async () => {
      // Prepare
      const app = new Router();
      const testData = 'middleware stream data';

      app.use(async () => ({
        statusCode: 200,
        body: Readable.from(Buffer.from(testData)),
      }));

      app.get('/test', () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(200);
      expect(result.isBase64Encoded).toBe(false);
      expect(result.body).toEqual(testData);
    });

    it('handles middleware returning ExtendedAPIGatewayProxyResult with web stream body', async () => {
      // Prepare
      const app = new Router();
      const testData = 'middleware web stream data';
      const webStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(testData));
          controller.close();
        },
      });

      app.use(async () => ({
        statusCode: 200,
        body: webStream,
      }));

      app.get('/test', () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(200);
      expect(result.isBase64Encoded).toBe(false);
      expect(result.body).toEqual(testData);
    });

    it('handles middleware returning v2 proxy event with cookies', async () => {
      // Prepare
      const app = new Router();

      app.use(async () => ({
        statusCode: 200,
        body: JSON.stringify({ message: 'middleware response' }),
        cookies: ['session=abc123', 'theme=dark'],
      }));

      app.get('/test', () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEventV2('/test', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(
        JSON.stringify({ message: 'middleware response' })
      );
      expect(result.cookies).toEqual(['session=abc123', 'theme=dark']);
    });
  });

  describe('middleware - route specific', () => {
    it('executes route-specific middleware after global middleware', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));
      const routeMiddleware = createTrackingMiddleware(
        'route-middleware',
        executionOrder
      );

      app.get('/test', [routeMiddleware], () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(executionOrder).toEqual([
        'global-middleware-start',
        'route-middleware-start',
        'handler',
        'route-middleware-end',
        'global-middleware-end',
      ]);
    });

    it('executes multiple route-specific middleware in order', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));
      const routeMiddleware1 = createTrackingMiddleware(
        'route-middleware-1',
        executionOrder
      );
      const routeMiddleware2 = createTrackingMiddleware(
        'route-middleware-2',
        executionOrder
      );

      app.get('/test', [routeMiddleware1, routeMiddleware2], () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(executionOrder).toEqual([
        'global-middleware-start',
        'route-middleware-1-start',
        'route-middleware-2-start',
        'handler',
        'route-middleware-2-end',
        'route-middleware-1-end',
        'global-middleware-end',
      ]);
    });

    it('routes without middleware only run global middleware', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));

      app.get('/test', () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(executionOrder).toEqual([
        'global-middleware-start',
        'handler',
        'global-middleware-end',
      ]);
    });

    it('allows route middleware to short-circuit and skip handler', async () => {
      // Prepare
      const app = new Router();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));
      const routeMiddleware = createReturningMiddleware(
        'route-middleware',
        executionOrder,
        new Response('Route middleware response', { status: 403 })
      );

      app.get('/test', [routeMiddleware], () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual([
        'global-middleware-start',
        'route-middleware',
        'global-middleware-end',
      ]);
      expect(result.statusCode).toBe(403);
      expect(result.body).toBe('Route middleware response');
    });

    it('allows post processing middleware to access the response returned early by a pre-processing middleware', async () => {
      // Prepare
      const app = new Router();
      let message = '';
      app.get(
        '/test',
        [
          async ({ reqCtx, next }) => {
            await next();
            const clonedRes = reqCtx.res.clone();
            message = (await clonedRes.json()).message;
          },
          () => {
            return Promise.resolve({ message: 'Middleware applied' });
          },
        ],
        () => {
          return { message: 'Handler applied' };
        }
      );

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(message).toEqual('Middleware applied');
    });
  });
});
