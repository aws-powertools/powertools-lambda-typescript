import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
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

describe('Class: BaseRouter', () => {
  class TestResolver extends BaseRouter {
    constructor(options?: RouterOptions) {
      super(options);
      this.logger.debug('test debug');
      this.logger.warn('test warn');
      this.logger.error('test error');
    }

    #isEvent(obj: unknown): asserts obj is { path: Path; method: HttpMethod } {
      if (
        typeof obj !== 'object' ||
        obj === null ||
        !('path' in obj) ||
        !('method' in obj) ||
        typeof (obj as any).path !== 'string' ||
        !(obj as any).path.startsWith('/') ||
        typeof (obj as any).method !== 'string' ||
        !Object.values(HttpVerbs).includes((obj as any).method as HttpMethod)
      ) {
        throw new Error('Invalid event object');
      }
    }

    public async resolve(event: unknown, context: Context): Promise<unknown> {
      this.#isEvent(event);
      const { method, path } = event;
      const route = this.routeRegistry.resolve(method, path);
      try {
        if (route == null)
          throw new NotFoundError(`Route ${method} ${path} not found`);
        return route.handler(event, context);
      } catch (error) {
        return await this.handleError(error as Error);
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
    ['TRACE', 'trace'],
    ['CONNECT', 'connect'],
  ])('routes %s requests', async (method, verb) => {
    // Prepare
    const app = new TestResolver();
    (
      app[verb as Lowercase<HttpMethod>] as (
        path: string,
        handler: RouteHandler
      ) => void
    )('/test', () => `${verb}-test`);
    // Act
    const actual = await app.resolve({ path: '/test', method }, context);
    // Assess
    expect(actual).toEqual(`${verb}-test`);
  });

  it('accepts multiple HTTP methods', async () => {
    // Act
    const app = new TestResolver();
    app.route(() => 'route-test', {
      path: '/test',
      method: [HttpVerbs.GET, HttpVerbs.POST],
    });

    // Act
    const getResult = await app.resolve(
      { path: '/test', method: HttpVerbs.GET },
      context
    );
    const postResult = await app.resolve(
      { path: '/test', method: HttpVerbs.POST },
      context
    );

    // Assess
    expect(getResult).toEqual('route-test');
    expect(postResult).toEqual('route-test');
  });

  it('uses the global console when no logger is not provided', () => {
    // Act
    const app = new TestResolver();
    app.route(() => true, { path: '/', method: HttpVerbs.GET });

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
    app.route(() => true, { path: '/', method: HttpVerbs.GET });

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
    app.route(() => true, { path: '/', method: HttpVerbs.GET });

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
        return 'get-test';
      }

      @app.post('/test')
      public async postTest() {
        return 'post-test';
      }

      @app.put('/test')
      public async putTest() {
        return 'put-test';
      }

      @app.patch('/test')
      public async patchTest() {
        return 'patch-test';
      }

      @app.delete('/test')
      public async deleteTest() {
        return 'delete-test';
      }

      @app.head('/test')
      public async headTest() {
        return 'head-test';
      }

      @app.options('/test')
      public async optionsTest() {
        return 'options-test';
      }

      @app.trace('/test')
      public async traceTest() {
        return 'trace-test';
      }

      @app.connect('/test')
      public async connectTest() {
        return 'connect-test';
      }

      public async handler(event: unknown, context: Context) {
        return app.resolve(event, context);
      }
    }

    it.each([
      ['GET', 'get-test'],
      ['POST', 'post-test'],
      ['PUT', 'put-test'],
      ['PATCH', 'patch-test'],
      ['DELETE', 'delete-test'],
      ['HEAD', 'head-test'],
      ['OPTIONS', 'options-test'],
      ['TRACE', 'trace-test'],
      ['CONNECT', 'connect-test'],
    ])('routes %s requests with decorators', async (method, expected) => {
      // Prepare
      const lambda = new Lambda();
      // Act
      const actual = await lambda.handler({ path: '/test', method }, context);
      // Assess
      expect(actual).toEqual(expected);
    });
  });

  describe('error handling', () => {
    it('calls registered error handler when BadRequestError is thrown', async () => {
      // Prepare
      const app = new TestResolver();

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
        { path: '/test', method: 'GET' },
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
        { path: '/nonexistent', method: 'GET' },
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
        { path: '/test', method: 'GET' },
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
        { path: '/test', method: 'GET' },
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
        { path: '/test', method: 'GET' },
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
        { path: '/test', method: 'GET' },
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
        { path: '/test', method: 'GET' },
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
        { path: '/test', method: 'GET' },
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
        { path: '/test', method: 'GET' },
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
        { path: '/bad', method: 'GET' },
        context
      )) as Response;
      const methodResult = (await app.resolve(
        { path: '/method', method: 'GET' },
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
        { path: '/test', method: 'GET' },
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
        { path: '/test', method: 'GET' },
        context
      )) as Response;

      // Assess
      expect(result.headers.get('Content-Type')).toBe('application/json');
    });
  });
});
