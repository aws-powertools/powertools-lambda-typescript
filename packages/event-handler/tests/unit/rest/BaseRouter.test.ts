import context from '@aws-lambda-powertools/testing-utils/context';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseRouter } from '../../../src/rest/BaseRouter.js';
import { HttpErrorCodes, HttpVerbs } from '../../../src/rest/constants.js';
import {
  BadRequestError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
} from '../../../src/rest/errors.js';
import type {
  HttpMethod,
  Path,
  RouteHandler,
  RouterOptions,
} from '../../../src/types/rest.js';

const createTestEvent = (
  path: string,
  httpMethod: string
): APIGatewayProxyEvent => ({
  path,
  httpMethod,
  headers: {},
  body: null,
  multiValueHeaders: {},
  isBase64Encoded: false,
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
});

describe('Class: BaseRouter', () => {
  class TestResolver extends BaseRouter {
    constructor(options?: RouterOptions) {
      super(options);
      this.logger.debug('test debug');
      this.logger.warn('test warn');
      this.logger.error('test error');
    }

    #isEvent(obj: unknown): asserts obj is APIGatewayProxyEvent {
      if (
        typeof obj !== 'object' ||
        obj === null ||
        !('path' in obj) ||
        !('httpMethod' in obj) ||
        typeof (obj as any).path !== 'string' ||
        !(obj as any).path.startsWith('/') ||
        typeof (obj as any).httpMethod !== 'string' ||
        !Object.values(HttpVerbs).includes(
          (obj as any).httpMethod as HttpMethod
        )
      ) {
        throw new Error('Invalid event object');
      }
    }

    public async resolve(
      event: unknown,
      context: Context,
      options?: any
    ): Promise<unknown> {
      this.#isEvent(event);
      const { httpMethod: method, path } = event;
      const route = this.routeRegistry.resolve(
        method as HttpMethod,
        path as Path
      );
      const request = new Request(`http://localhost${path}`, {
        method,
        headers: event.headers as Record<string, string>,
        body: event.body,
      });
      try {
        if (route == null)
          throw new NotFoundError(`Route ${method} ${path} not found`);
        return await route.handler(route.params, { request, event, context });
      } catch (error) {
        return await this.handleError(error as Error, {
          request,
          event,
          context,
          ...options,
        });
      }
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
    const actual = (await app.resolve(
      createTestEvent('/test', method),
      context
    )) as Response;
    // Assess
    expect(actual).toEqual({ result: `${verb}-test` });
  });

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
    expect(getResult).toEqual({ result: 'route-test' });
    expect(postResult).toEqual({ result: 'route-test' });
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
      expect(actual).toEqual(expected);
    });
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
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.BAD_REQUEST);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Handled: test error',
        })
      );
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
      const result = (await app.resolve(
        createTestEvent('/nonexistent', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.NOT_FOUND);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.NOT_FOUND,
          error: 'Not Found',
          message: 'Custom: Route GET /nonexistent not found',
        })
      );
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
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.METHOD_NOT_ALLOWED);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
          error: 'Method Not Allowed',
          message: 'Custom: POST not allowed',
        })
      );
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
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = await result.json();
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
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = await result.json();
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
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.BAD_REQUEST);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Specific handler',
        })
      );
    });

    it('uses ServiceError toJSON method when no custom handler is registered', async () => {
      // Prepare
      const app = new TestResolver();

      app.get('/test', () => {
        throw new InternalServerError('service error');
      });

      // Act
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.INTERNAL_SERVER_ERROR,
          error: 'InternalServerError',
          message: 'service error',
        })
      );
    });

    it('hides error details when POWERTOOLS_DEV env var is not set', async () => {
      // Prepare
      const app = new TestResolver();

      app.get('/test', () => {
        throw new Error('sensitive error details');
      });

      // Act
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = await result.json();
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
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.INTERNAL_SERVER_ERROR);
      const body = await result.json();
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
      const badResult = (await app.resolve(
        createTestEvent('/bad', 'GET'),
        context
      )) as Response;
      const methodResult = (await app.resolve(
        createTestEvent('/method', 'GET'),
        context
      )) as Response;

      // Assess
      expect(badResult.status).toBe(HttpErrorCodes.UNPROCESSABLE_ENTITY);
      expect(await badResult.json()).toEqual({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        error: 'Validation Error',
        message: 'Array handler: bad request',
      });

      expect(methodResult.status).toBe(HttpErrorCodes.UNPROCESSABLE_ENTITY);
      expect(await methodResult.json()).toEqual({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        error: 'Validation Error',
        message: 'Array handler: method not allowed',
      });
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
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result.status).toBe(HttpErrorCodes.UNPROCESSABLE_ENTITY);
      expect(await result.json()).toEqual({
        statusCode: HttpErrorCodes.UNPROCESSABLE_ENTITY,
        error: 'Second Handler',
        message: 'second: test error',
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
      const result = (await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result.headers.get('Content-Type')).toBe('application/json');
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
      const result = (await lambda.handler(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.BAD_REQUEST);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Decorated: test error',
        })
      );
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
      const result = (await lambda.handler(
        createTestEvent('/nonexistent', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.NOT_FOUND);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.NOT_FOUND,
          error: 'Not Found',
          message: 'Decorated: Route GET /nonexistent not found',
        })
      );
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
      const result = (await lambda.handler(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.METHOD_NOT_ALLOWED);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
          error: 'Method Not Allowed',
          message: 'Decorated: POST not allowed',
        })
      );
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
      const result = (await handler(
        createTestEvent('/test', 'GET'),
        context
      )) as Response;

      // Assess
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(HttpErrorCodes.BAD_REQUEST);
      expect(await result.text()).toBe(
        JSON.stringify({
          statusCode: HttpErrorCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'scoped: test error',
        })
      );
    });
  });

  describe('handler options passing', () => {
    it('passes request, event, and context to functional route handlers', async () => {
      // Prepare
      const app = new TestResolver();
      const testEvent = createTestEvent('/test', 'GET');

      app.get('/test', async (_params, options) => {
        return {
          hasRequest: options?.request instanceof Request,
          hasEvent: options?.event === testEvent,
          hasContext: options?.context === context,
        };
      });

      // Act
      const actual = (await app.resolve(testEvent, context)) as any;

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
      const result = (await app.resolve(testEvent, context)) as Response;
      const body = await result.json();

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
            hasRequest: options?.request instanceof Request,
            hasEvent: options?.event === testEvent,
            hasContext: options?.context === context,
          };
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context);
        }
      }

      const lambda = new Lambda();

      // Act
      const actual = (await lambda.handler(testEvent, context)) as any;

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
      const result = (await lambda.handler(testEvent, context)) as Response;
      const body = await result.json();

      // Assess
      expect(body.hasRequest).toBe(true);
      expect(body.hasEvent).toBe(true);
      expect(body.hasContext).toBe(true);
    });
  });
});
