import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseRouter } from '../../../src/rest/BaseRouter.js';
import { HttpErrorCodes, HttpVerbs } from '../../../src/rest/constants.js';
import {
  BadRequestError,
  InternalServerError,
  MethodNotAllowedError,
  type NotFoundError,
} from '../../../src/rest/errors.js';
import type {
  HttpMethod,
  Middleware,
  Path,
  RequestContext,
  RouteHandler,
  RouterOptions,
} from '../../../src/types/rest.js';
import {
  createNoNextMiddleware,
  createReturningMiddleware,
  createTestEvent,
  createThrowingMiddleware,
  createTrackingMiddleware,
} from './helpers.js';

describe('Class: BaseRouter', () => {
  class TestResolver extends BaseRouter {
    constructor(options?: RouterOptions) {
      super(options);
      this.logger.debug('test debug');
      this.logger.warn('test warn');
      this.logger.error('test error');
    }
  }

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['GET', 'get'],
    ['POST', 'post'],
    ['PUT', 'put'],
    ['PATCH', 'patch'],
    ['DELETE', 'delete'],
    ['HEAD', 'head'],
    ['OPTIONS', 'options'],
  ])('routes %s requests', async (method, verb) => {
    // Prepare
    const app = new TestResolver();
    (
      app[verb as Lowercase<HttpMethod>] as (
        path: string,
        handler: RouteHandler
      ) => void
    )('/test', async () => ({ result: `${verb}-test` }));
    // Act
    const actual = await app.resolve(createTestEvent('/test', method), context);
    // Assess
    expect(actual).toEqual({
      statusCode: 200,
      body: JSON.stringify({ result: `${verb}-test` }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    });
  });

  it.each([['CONNECT'], ['TRACE']])(
    'throws MethodNotAllowedError for %s requests',
    async (method) => {
      // Prepare
      const app = new TestResolver();

      // Act & Assess
      const result = await app.resolve(
        createTestEvent('/test', method),
        context
      );

      expect(result?.statusCode).toBe(HttpErrorCodes.METHOD_NOT_ALLOWED);
      expect(result?.body).toEqual('');
    }
  );

  it('accepts multiple HTTP methods', async () => {
    // Act
    const app = new TestResolver();
    app.route(async () => ({ result: 'route-test' }), {
      path: '/test',
      method: [HttpVerbs.GET, HttpVerbs.POST],
    });

    // Act
    const getResult = await app.resolve(
      createTestEvent('/test', HttpVerbs.GET),
      context
    );
    const postResult = await app.resolve(
      createTestEvent('/test', HttpVerbs.POST),
      context
    );

    // Assess
    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify({ result: 'route-test' }),
      headers: { 'content-type': 'application/json' },
      isBase64Encoded: false,
    };
    expect(getResult).toEqual(expectedResult);
    expect(postResult).toEqual(expectedResult);
  });

  it('uses the global console when no logger is not provided', () => {
    // Act
    const app = new TestResolver();
    app.route(async () => ({ success: true }), {
      path: '/',
      method: HttpVerbs.GET,
    });

    // Assess
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('test error');
    expect(console.warn).toHaveBeenCalledWith('test warn');
  });

  it('emits debug logs using global console when the log level is set to `DEBUG` and a logger is not provided', () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');

    // Act
    const app = new TestResolver();
    app.route(async () => ({ success: true }), {
      path: '/',
      method: HttpVerbs.GET,
    });

    // Assess
    expect(console.debug).toHaveBeenCalledWith('test debug');
    expect(console.error).toHaveBeenCalledWith('test error');
    expect(console.warn).toHaveBeenCalledWith('test warn');
  });

  it('uses a custom logger when provided', () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Act
    const app = new TestResolver({ logger });
    app.route(async () => ({ success: true }), {
      path: '/',
      method: HttpVerbs.GET,
    });

    // Assess
    expect(logger.error).toHaveBeenCalledWith('test error');
    expect(logger.warn).toHaveBeenCalledWith('test warn');
    expect(logger.debug).toHaveBeenCalledWith('test debug');
  });

  describe('middleware - global', () => {
    it('executes middleware in order before route handler', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('middleware1', executionOrder));
      app.use(createTrackingMiddleware('middleware2', executionOrder));

      app.get('/test', async () => {
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
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('middleware1', executionOrder));
      app.use(
        createReturningMiddleware(
          'middleware2',
          executionOrder,
          new Response('Short-circuited', { status: 401 })
        )
      );

      app.get('/test', async () => {
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
      expect(result?.statusCode).toBe(401);
      expect(result?.body).toBe('Short-circuited');
    });

    it('passes params and options to middleware', async () => {
      // Prepare
      const app = new TestResolver();
      let middlewareParams: Record<string, string> | undefined;
      let middlewareOptions: RequestContext | undefined;

      app.use(async (params, options, next) => {
        middlewareParams = params;
        middlewareOptions = options;
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
      expect(middlewareOptions?.request).toBeInstanceOf(Request);
    });

    it('returns error response when next() is called multiple times', async () => {
      // Prepare
      vi.stubEnv('POWERTOOLS_DEV', 'true');
      const app = new TestResolver();

      app.use(async (params, options, next) => {
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
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(result?.body ?? '{}');
      expect(body.message).toContain('next() called multiple times');
    });

    it('handles errors thrown in middleware before next()', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(
        createThrowingMiddleware(
          'middleware1',
          executionOrder,
          'Middleware error'
        )
      );
      app.use(createTrackingMiddleware('middleware2', executionOrder));

      app.get('/test', async () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assesss
      expect(executionOrder).toEqual(['middleware1']);
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles errors thrown in middleware after next()', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(async (params, options, next) => {
        executionOrder.push('middleware1-start');
        await next();
        executionOrder.push('middleware1-end');
        throw new Error('Cleanup error');
      });

      app.get('/test', async () => {
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
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('propagates handler errors through middleware chain', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('middleware1', executionOrder));
      app.use(createTrackingMiddleware('middleware2', executionOrder));

      app.get('/test', async () => {
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
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles middleware not calling next()', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createNoNextMiddleware('middleware1', executionOrder));
      app.use(createTrackingMiddleware('middleware2', executionOrder));

      app.get('/test', async () => {
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
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles middleware returning JSON objects', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('middleware1', executionOrder));
      app.use(
        createReturningMiddleware('middleware2', executionOrder, {
          statusCode: 202,
          message: 'Accepted by middleware',
        })
      );

      app.get('/test', async () => {
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
      expect(result?.statusCode).toBe(200);
      const body = JSON.parse(result?.body ?? '{}');
      expect(body).toEqual({
        statusCode: 202,
        message: 'Accepted by middleware',
      });
    });

    it('allows middleware to manipulate response headers', async () => {
      // Prepare
      const app = new TestResolver();

      app.use(async (params, options, next) => {
        await next();
        options.res.headers.set('x-custom-header', 'middleware-value');
        options.res.headers.set('x-request-id', '12345');
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
          'x-custom-header': 'middleware-value',
          'x-request-id': '12345',
        },
        isBase64Encoded: false,
      });
    });

    it('allows middleware to completely overwrite response', async () => {
      // Prepare
      const app = new TestResolver();

      app.use(async (params, options, next) => {
        await next();
        const originalBody = await options.res.text();
        options.res = new Response(`Modified: ${originalBody}`, {
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
      const app = new TestResolver();

      app.use(async (params, options, next) => {
        options.res.headers.set('x-before-handler', 'middleware-value');
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

    it('overwrites headers when set later in the middleware stack', async () => {
      // Prepare
      const app = new TestResolver();

      app.use(async (params, options, next) => {
        options.res.headers.set('x-test-header', 'before-next');
        await next();
      });

      app.use(async (params, options, next) => {
        await next();
        options.res.headers.set('x-test-header', 'after-next');
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

    it('works with class decorators and preserves scope access', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(async (params, options, next) => {
        executionOrder.push('middleware-start');
        await next();
        executionOrder.push('middleware-end');
      });

      class Lambda {
        public scope = 'class-scope';

        @app.get('/test')
        public async getTest() {
          executionOrder.push('handler');
          return { message: `${this.scope}: success` };
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context, { scope: this });
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
  });

  describe('middleware - route specific', () => {
    it('executes route-specific middleware after global middleware', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));
      const routeMiddleware = createTrackingMiddleware(
        'route-middleware',
        executionOrder
      );

      app.get('/test', [routeMiddleware], async () => {
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
      const app = new TestResolver();
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

      app.get('/test', [routeMiddleware1, routeMiddleware2], async () => {
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
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));

      app.get('/test', async () => {
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
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));
      const routeMiddleware = createReturningMiddleware(
        'route-middleware',
        executionOrder,
        new Response('Route middleware response', { status: 403 })
      );

      app.get('/test', [routeMiddleware], async () => {
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
      expect(result?.statusCode).toBe(403);
      expect(result?.body).toBe('Route middleware response');
    });

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
        const app = new TestResolver();
        const executionOrder: string[] = [];

        app.use(async (params, options, next) => {
          executionOrder.push('global-middleware');
          await next();
        });

        const middleware: Middleware[] = middlewareNames.map(
          (name) => async (params, options, next) => {
            executionOrder.push(name);
            await next();
          }
        );

        app.get(path as Path, middleware, async () => {
          executionOrder.push('handler');
          return { success: true };
        });

        // Act
        await app.resolve(createTestEvent(path, 'GET'), context);

        // Assess
        expect(executionOrder).toEqual(expectedOrder);
      }
    );

    it('handles errors thrown in route middleware before next()', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      const routeMiddleware = createThrowingMiddleware(
        'route-middleware',
        executionOrder,
        'Route middleware error'
      );

      app.get('/test', [routeMiddleware], async () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual(['route-middleware']);
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles errors thrown in route middleware after next()', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      const routeMiddleware: Middleware = async (params, options, next) => {
        executionOrder.push('route-middleware-start');
        await next();
        executionOrder.push('route-middleware-end');
        throw new Error('Route cleanup error');
      };

      app.get('/test', [routeMiddleware], async () => {
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
        'route-middleware-start',
        'handler',
        'route-middleware-end',
      ]);
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles route middleware not calling next()', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      const routeMiddleware = createNoNextMiddleware(
        'route-middleware',
        executionOrder
      );

      app.get('/test', [routeMiddleware], async () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual(['route-middleware']);
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles route middleware returning JSON objects', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      const routeMiddleware = createReturningMiddleware(
        'route-middleware',
        executionOrder,
        { statusCode: 202, message: 'Accepted by route middleware' }
      );

      app.get('/test', [routeMiddleware], async () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual(['route-middleware']);
      expect(result?.statusCode).toBe(200);
      const body = JSON.parse(result?.body ?? '{}');
      expect(body).toEqual({
        statusCode: 202,
        message: 'Accepted by route middleware',
      });
    });

    it('passes params and options to route middleware', async () => {
      // Prepare
      const app = new TestResolver();
      let middlewareParams: Record<string, string> | undefined;
      let middlewareOptions: RequestContext | undefined;

      const routeMiddleware: Middleware = async (params, options, next) => {
        middlewareParams = params;
        middlewareOptions = options;
        await next();
      };

      app.get('/test/:id', [routeMiddleware], async () => ({ success: true }));

      // Act
      const testEvent = createTestEvent('/test/123', 'GET');
      await app.resolve(testEvent, context);

      // Assess
      expect(middlewareParams).toEqual({ id: '123' });
      expect(middlewareOptions?.event).toBe(testEvent);
      expect(middlewareOptions?.context).toBe(context);
      expect(middlewareOptions?.request).toBeInstanceOf(Request);
    });

    it('propagates errors through mixed global and route middleware', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));
      const routeMiddleware = createTrackingMiddleware(
        'route-middleware',
        executionOrder
      );

      app.get('/test', [routeMiddleware], async () => {
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
        'global-middleware-start',
        'route-middleware-start',
        'handler',
      ]);
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles errors when global middleware throws before route middleware', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(
        createThrowingMiddleware(
          'global-middleware',
          executionOrder,
          'Global middleware error'
        )
      );
      const routeMiddleware = createTrackingMiddleware(
        'route-middleware',
        executionOrder
      );

      app.get('/test', [routeMiddleware], async () => {
        executionOrder.push('handler');
        return { success: true };
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(executionOrder).toEqual(['global-middleware']);
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });

    it('handles errors when route middleware throws with global middleware present', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];

      app.use(createTrackingMiddleware('global-middleware', executionOrder));
      const routeMiddleware = createThrowingMiddleware(
        'route-middleware',
        executionOrder,
        'Route middleware error'
      );

      app.get('/test', [routeMiddleware], async () => {
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
      ]);
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('decorators', () => {
    const app = new TestResolver();

    class Lambda {
      @app.get('/test')
      public async getTest() {
        return { result: 'get-test' };
      }

      @app.post('/test')
      public async postTest() {
        return { result: 'post-test' };
      }

      @app.put('/test')
      public async putTest() {
        return { result: 'put-test' };
      }

      @app.patch('/test')
      public async patchTest() {
        return { result: 'patch-test' };
      }

      @app.delete('/test')
      public async deleteTest() {
        return { result: 'delete-test' };
      }

      @app.head('/test')
      public async headTest() {
        return { result: 'head-test' };
      }

      @app.options('/test')
      public async optionsTest() {
        return { result: 'options-test' };
      }

      public async handler(event: unknown, context: Context) {
        return app.resolve(event, context);
      }
    }

    it.each([
      ['GET', { result: 'get-test' }],
      ['POST', { result: 'post-test' }],
      ['PUT', { result: 'put-test' }],
      ['PATCH', { result: 'patch-test' }],
      ['DELETE', { result: 'delete-test' }],
      ['HEAD', { result: 'head-test' }],
      ['OPTIONS', { result: 'options-test' }],
    ])('routes %s requests with decorators', async (method, expected) => {
      // Prepare
      const lambda = new Lambda();
      // Act
      const actual = await lambda.handler(
        createTestEvent('/test', method),
        context
      );
      // Assess
      expect(actual).toEqual({
        statusCode: 200,
        body: JSON.stringify(expected),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });
  });

  describe('decorators with middleware', () => {
    it('executes middleware with decorator syntax', async () => {
      // Prepare
      const app = new TestResolver();
      const executionOrder: string[] = [];
      const middleware = createTrackingMiddleware(
        'decorator-middleware',
        executionOrder
      );

      class Lambda {
        public scope = 'class-scope';

        @app.get('/test', [middleware])
        public async getTest() {
          executionOrder.push('handler');
          return { result: `${this.scope}: decorator-with-middleware` };
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context, { scope: this });
        }
      }

      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(executionOrder).toEqual([
        'decorator-middleware-start',
        'handler',
        'decorator-middleware-end',
      ]);
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          result: 'class-scope: decorator-with-middleware',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it.each([
      ['GET', { result: 'get-decorator-middleware' }],
      ['POST', { result: 'post-decorator-middleware' }],
      ['PUT', { result: 'put-decorator-middleware' }],
      ['PATCH', { result: 'patch-decorator-middleware' }],
      ['DELETE', { result: 'delete-decorator-middleware' }],
      ['HEAD', { result: 'head-decorator-middleware' }],
      ['OPTIONS', { result: 'options-decorator-middleware' }],
    ])(
      'routes %s requests with decorator middleware',
      async (method, expected) => {
        // Prepare
        const app = new TestResolver();
        const executionOrder: string[] = [];
        const middleware = createTrackingMiddleware(
          `${method.toLowerCase()}-middleware`,
          executionOrder
        );

        class Lambda {
          @app.get('/test', [middleware])
          public async getTest() {
            return { result: 'get-decorator-middleware' };
          }

          @app.post('/test', [middleware])
          public async postTest() {
            return { result: 'post-decorator-middleware' };
          }

          @app.put('/test', [middleware])
          public async putTest() {
            return { result: 'put-decorator-middleware' };
          }

          @app.patch('/test', [middleware])
          public async patchTest() {
            return { result: 'patch-decorator-middleware' };
          }

          @app.delete('/test', [middleware])
          public async deleteTest() {
            return { result: 'delete-decorator-middleware' };
          }

          @app.head('/test', [middleware])
          public async headTest() {
            return { result: 'head-decorator-middleware' };
          }

          @app.options('/test', [middleware])
          public async optionsTest() {
            return { result: 'options-decorator-middleware' };
          }

          public async handler(event: unknown, context: Context) {
            return app.resolve(event, context);
          }
        }

        const lambda = new Lambda();

        // Act
        const result = await lambda.handler(
          createTestEvent('/test', method),
          context
        );

        // Assess
        expect(executionOrder).toEqual([
          `${method.toLowerCase()}-middleware-start`,
          `${method.toLowerCase()}-middleware-end`,
        ]);
        expect(result).toEqual({
          statusCode: 200,
          body: JSON.stringify(expected),
          headers: { 'content-type': 'application/json' },
          isBase64Encoded: false,
        });
      }
    );
  });

  describe('error handling', () => {
    it('calls registered error handler when BadRequestError is thrown', async () => {
      // Prepare
      const app = new TestResolver();
      vi.stubEnv('POWERTOOLS_DEV', 'true');

      app.errorHandler(BadRequestError, async (error) => ({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: `Handled: ${error.message}`,
      }));

      app.get('/test', () => {
        throw new BadRequestError('test error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Handled: test error',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('calls notFound handler when route is not found', async () => {
      // Prepare
      const app = new TestResolver();

      app.notFound(async (error) => ({
        statusCode: HttpErrorCodes.NOT_FOUND,
        error: 'Not Found',
        message: `Custom: ${error.message}`,
      }));

      // Act
      const result = await app.resolve(
        createTestEvent('/nonexistent', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.NOT_FOUND,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.NOT_FOUND,
          error: 'Not Found',
          message: 'Custom: Route /nonexistent for method GET not found',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('calls methodNotAllowed handler when MethodNotAllowedError is thrown', async () => {
      // Prepare
      const app = new TestResolver();

      app.methodNotAllowed(async (error) => ({
        statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
        error: 'Method Not Allowed',
        message: `Custom: ${error.message}`,
      }));

      app.get('/test', () => {
        throw new MethodNotAllowedError('POST not allowed');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
          error: 'Method Not Allowed',
          message: 'Custom: POST not allowed',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('falls back to default error handler when registered handler throws', async () => {
      // Prepare
      const app = new TestResolver();

      app.errorHandler(BadRequestError, async () => {
        throw new Error('Handler failed');
      });

      app.get('/test', () => {
        throw new BadRequestError('original error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(result?.body ?? '{}');
      expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Internal Server Error');
    });

    it('uses default handling when no error handler is registered', async () => {
      // Prepare
      const app = new TestResolver();

      app.get('/test', () => {
        throw new Error('unhandled error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(result?.body ?? '{}');
      expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Internal Server Error');
    });

    it('calls most specific error handler when multiple handlers match', async () => {
      // Prepare
      const app = new TestResolver();

      app.errorHandler(Error, async () => ({
        statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
        error: 'Generic Error',
        message: 'Generic handler',
      }));

      app.errorHandler(BadRequestError, async () => ({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Specific handler',
      }));

      app.get('/test', () => {
        throw new BadRequestError('test error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Specific handler',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('uses ServiceError toJSON method when no custom handler is registered', async () => {
      // Prepare
      const app = new TestResolver();

      app.get('/test', () => {
        throw new InternalServerError('service error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
          error: 'InternalServerError',
          message: 'service error',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('hides error details when POWERTOOLS_DEV env var is not set', async () => {
      // Prepare
      const app = new TestResolver();

      app.get('/test', () => {
        throw new Error('sensitive error details');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(result?.body ?? '{}');
      expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Internal Server Error');
      expect(body.stack).toBeUndefined();
      expect(body.details).toBeUndefined();
    });

    it('shows error details in development mode', async () => {
      // Prepare
      vi.stubEnv('POWERTOOLS_DEV', 'true');
      const app = new TestResolver();

      app.get('/test', () => {
        throw new Error('debug error details');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(result?.body ?? '{}');
      expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('debug error details');
      expect(body.stack).toBeDefined();
      expect(body.details).toBeDefined();
      expect(body.details.errorName).toBe('Error');
    });

    it('accepts array of error types for single handler', async () => {
      // Prepare
      const app = new TestResolver();

      app.errorHandler(
        [BadRequestError, MethodNotAllowedError],
        async (error: Error) => ({
          statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
          error: 'Validation Error',
          message: `Array handler: ${error.message}`,
        })
      );

      app.get('/bad', () => {
        throw new BadRequestError('bad request');
      });

      app.get('/method', () => {
        throw new MethodNotAllowedError('method not allowed');
      });

      // Act
      const badResult = await app.resolve(
        createTestEvent('/bad', 'GET'),
        context
      );
      const methodResult = await app.resolve(
        createTestEvent('/method', 'GET'),
        context
      );

      // Assess
      const expectedBadResult = {
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
          error: 'Validation Error',
          message: 'Array handler: bad request',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      };
      const expectedMethodResult = {
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
          error: 'Validation Error',
          message: 'Array handler: method not allowed',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      };

      expect(badResult).toEqual(expectedBadResult);
      expect(methodResult).toEqual(expectedMethodResult);
    });

    it('replaces previous handler when registering new handler for same error type', async () => {
      // Prepare
      const app = new TestResolver();

      app.errorHandler(BadRequestError, async () => ({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'First Handler',
        message: 'first',
      }));

      app.errorHandler(BadRequestError, async (error) => ({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        error: 'Second Handler',
        message: `second: ${error.message}`,
      }));

      app.get('/test', () => {
        throw new BadRequestError('test error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
          error: 'Second Handler',
          message: 'second: test error',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('returns response with correct Content-Type header', async () => {
      // Prepare
      const app = new TestResolver();

      app.errorHandler(BadRequestError, async (error) => ({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: error.message,
      }));

      app.get('/test', () => {
        throw new BadRequestError('test error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result?.headers?.['content-type']).toBe('application/json');
    });
  });

  describe('decorators error handling', () => {
    it('works with errorHandler decorator', async () => {
      // Prepare
      const app = new TestResolver();

      class Lambda {
        @app.errorHandler(BadRequestError)
        public async handleBadRequest(error: BadRequestError) {
          return {
            statusCode: HttpErrorCodes.BAD_REQUEST,
            error: 'Bad Request',
            message: `Decorated: ${error.message}`,
          };
        }

        @app.get('/test')
        public async getTest() {
          throw new BadRequestError('test error');
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context);
        }
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Decorated: test error',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('works with notFound decorator', async () => {
      // Prepare
      const app = new TestResolver();

      class Lambda {
        @app.notFound()
        public async handleNotFound(error: NotFoundError) {
          return {
            statusCode: HttpErrorCodes.NOT_FOUND,
            error: 'Not Found',
            message: `Decorated: ${error.message}`,
          };
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context);
        }
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(
        createTestEvent('/nonexistent', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.NOT_FOUND,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.NOT_FOUND,
          error: 'Not Found',
          message: 'Decorated: Route /nonexistent for method GET not found',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('works with methodNotAllowed decorator', async () => {
      // Prepare
      const app = new TestResolver();

      class Lambda {
        @app.methodNotAllowed()
        public async handleMethodNotAllowed(error: MethodNotAllowedError) {
          return {
            statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
            error: 'Method Not Allowed',
            message: `Decorated: ${error.message}`,
          };
        }

        @app.get('/test')
        public async getTest() {
          throw new MethodNotAllowedError('POST not allowed');
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context);
        }
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
          error: 'Method Not Allowed',
          message: 'Decorated: POST not allowed',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('preserves scope when using error handler decorators', async () => {
      // Prepare
      const app = new TestResolver();

      class Lambda {
        public scope = 'scoped';

        @app.errorHandler(BadRequestError)
        public async handleBadRequest(error: BadRequestError) {
          return {
            statusCode: HttpErrorCodes.BAD_REQUEST,
            error: 'Bad Request',
            message: `${this.scope}: ${error.message}`,
          };
        }

        @app.get('/test')
        public async getTest() {
          throw new BadRequestError('test error');
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context, { scope: this });
        }
      }

      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(result).toEqual({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        body: JSON.stringify({
          statusCode: HttpErrorCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'scoped: test error',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });
  });

  describe('handler options passing', () => {
    it('passes request, event, and context to functional route handlers', async () => {
      // Prepare
      const app = new TestResolver();
      const testEvent = createTestEvent('/test', 'GET');

      app.get('/test', async (_params, options) => {
        return {
          hasRequest: options.request instanceof Request,
          hasEvent: options.event === testEvent,
          hasContext: options.context === context,
        };
      });

      // Act
      const result = await app.resolve(testEvent, context);
      const actual = JSON.parse(result?.body ?? '{}');

      // Assess
      expect(actual.hasRequest).toBe(true);
      expect(actual.hasEvent).toBe(true);
      expect(actual.hasContext).toBe(true);
    });

    it('passes request, event, and context to functional error handlers', async () => {
      // Prepare
      const app = new TestResolver();
      const testEvent = createTestEvent('/test', 'GET');

      app.errorHandler(BadRequestError, async (error, options) => ({
        statusCode: HttpErrorCodes.BAD_REQUEST,
        error: 'Bad Request',
        message: error.message,
        hasRequest: options.request instanceof Request,
        hasEvent: options.event === testEvent,
        hasContext: options.context === context,
      }));

      app.get('/test', () => {
        throw new BadRequestError('test error');
      });

      // Act
      const result = await app.resolve(testEvent, context);
      const body = JSON.parse(result?.body ?? '{}');

      // Assess
      expect(body.hasRequest).toBe(true);
      expect(body.hasEvent).toBe(true);
      expect(body.hasContext).toBe(true);
    });

    it('passes request, event, and context to decorator route handlers', async () => {
      // Prepare
      const app = new TestResolver();
      const testEvent = createTestEvent('/test', 'GET');

      class Lambda {
        @app.get('/test')
        public async getTest(_params: any, options: any) {
          return {
            hasRequest: options.request instanceof Request,
            hasEvent: options.event === testEvent,
            hasContext: options.context === context,
          };
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context);
        }
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(testEvent, context);
      const actual = JSON.parse(result?.body ?? '{}');

      // Assess
      expect(actual.hasRequest).toBe(true);
      expect(actual.hasEvent).toBe(true);
      expect(actual.hasContext).toBe(true);
    });

    it('passes request, event, and context to decorator error handlers', async () => {
      // Prepare
      const app = new TestResolver();
      const testEvent = createTestEvent('/test', 'GET');

      class Lambda {
        @app.errorHandler(BadRequestError)
        public async handleBadRequest(error: BadRequestError, options: any) {
          return {
            statusCode: HttpErrorCodes.BAD_REQUEST,
            error: 'Bad Request',
            message: error.message,
            hasRequest: options.request instanceof Request,
            hasEvent: options.event === testEvent,
            hasContext: options.context === context,
          };
        }

        @app.get('/test')
        public async getTest() {
          throw new BadRequestError('test error');
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context);
        }
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(testEvent, context);
      const body = JSON.parse(result?.body ?? '{}');

      // Assess
      expect(body.hasRequest).toBe(true);
      expect(body.hasEvent).toBe(true);
      expect(body.hasContext).toBe(true);
    });

    it('preserves scope when using route handler decorators', async () => {
      // Prepare
      const app = new TestResolver();

      class Lambda {
        public scope = 'scoped';

        @app.get('/test')
        public async getTest() {
          return {
            message: `${this.scope}: success`,
          };
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context, { scope: this });
        }
      }

      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(result).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          message: 'scoped: success',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });
  });

  describe('resolve method', () => {
    it('throws an internal server error for non-API Gateway events', async () => {
      // Prepare
      const app = new TestResolver();
      const nonApiGatewayEvent = { Records: [] }; // SQS-like event

      // Act & Assess
      expect(app.resolve(nonApiGatewayEvent, context)).rejects.toThrowError(
        InternalServerError
      );
    });

    it('returns APIGatewayProxyResult for successful requests', async () => {
      // Prepare
      const app = new TestResolver();
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
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('returns APIGatewayProxyResult for error responses', async () => {
      // Prepare
      const app = new TestResolver();
      app.get('/test', () => {
        throw new Error('test error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result?.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = JSON.parse(result?.body ?? '{}');
      expect(body.statusCode).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      expect(body.error).toBe('Internal Server Error');
    });
  });
});
