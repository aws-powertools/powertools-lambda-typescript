import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import {
  BadRequestError,
  HttpErrorCodes,
  MethodNotAllowedError,
  type NotFoundError,
  Router,
} from '../../../../src/rest/index.js';
import { createTestEvent, createTrackingMiddleware } from '../helpers.js';

describe('Class: Router - Decorators', () => {
  describe('decorators', () => {
    const app = new Router();

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

      public async handler(event: unknown, _context: Context) {
        return app.resolve(event, _context);
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
      const app = new Router();
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

        public async handler(event: unknown, _context: Context) {
          return app.resolve(event, _context, { scope: this });
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
        const app = new Router();
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

          public async handler(event: unknown, _context: Context) {
            return app.resolve(event, _context);
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

  describe('decorators error handling', () => {
    it('works with errorHandler decorator', async () => {
      // Prepare
      const app = new Router();

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

        public async handler(event: unknown, _context: Context) {
          return app.resolve(event, _context);
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
      const app = new Router();

      class Lambda {
        @app.notFound()
        public async handleNotFound(error: NotFoundError) {
          return {
            statusCode: HttpErrorCodes.NOT_FOUND,
            error: 'Not Found',
            message: `Decorated: ${error.message}`,
          };
        }

        public async handler(event: unknown, _context: Context) {
          return app.resolve(event, _context);
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
      const app = new Router();

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

        public async handler(event: unknown, _context: Context) {
          return app.resolve(event, _context);
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
      const app = new Router();

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

        public async handler(event: unknown, _context: Context) {
          return app.resolve(event, _context, { scope: this });
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
    it('passes request, event, and context to decorator route handlers', async () => {
      // Prepare
      const app = new Router();
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

        public async handler(event: unknown, _context: Context) {
          return app.resolve(event, _context);
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
      const app = new Router();
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

        public async handler(event: unknown, _context: Context) {
          return app.resolve(event, _context);
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
      const app = new Router();

      class Lambda {
        public scope = 'scoped';

        @app.get('/test')
        public async getTest() {
          return {
            message: `${this.scope}: success`,
          };
        }

        public async handler(event: unknown, _context: Context) {
          return app.resolve(event, _context, { scope: this });
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
});
