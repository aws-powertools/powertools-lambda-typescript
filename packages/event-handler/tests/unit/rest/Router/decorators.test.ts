import context from '@aws-lambda-powertools/testing-utils/context';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import {
  BadRequestError,
  HttpStatusCodes,
  MethodNotAllowedError,
  type NotFoundError,
  Router,
  UnauthorizedError,
} from '../../../../src/rest/index.js';
import type { RequestContext } from '../../../../src/types/rest.js';
import {
  createTestEvent,
  createTestEventV2,
  createTrackingMiddleware,
  MockResponseStream,
  parseStreamOutput,
} from '../helpers.js';

const createHandler = (app: Router) => {
  function handler(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult>;
  function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyStructuredResultV2>;
  function handler(
    event: unknown,
    context: Context
  ): Promise<APIGatewayProxyResult | APIGatewayProxyStructuredResultV2>;
  function handler(event: unknown, context: Context) {
    return app.resolve(event, context);
  }
  return handler;
};

const createHandlerWithScope = (app: Router, scope: unknown) => {
  function handler(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult>;
  function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyStructuredResultV2>;
  function handler(
    event: unknown,
    context: Context
  ): Promise<APIGatewayProxyResult | APIGatewayProxyStructuredResultV2>;
  function handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope });
  }
  return handler;
};

const createStreamHandler =
  (app: Router, scope: unknown) =>
  (event: unknown, _context: Context, responseStream: MockResponseStream) =>
    app.resolveStream(event, _context, { scope, responseStream });

describe.each([
  { version: 'V1', createEvent: createTestEvent },
  { version: 'V2', createEvent: createTestEventV2 },
])('Class: Router - Decorators ($version)', ({ createEvent }) => {
  describe('decorators', () => {
    const app = new Router();

    class Lambda {
      @app.get('/test')
      public getTest() {
        return { result: 'get-test' };
      }

      @app.post('/test')
      public postTest() {
        return { result: 'post-test' };
      }

      @app.put('/test')
      public putTest() {
        return { result: 'put-test' };
      }

      @app.patch('/test')
      public patchTest() {
        return { result: 'patch-test' };
      }

      @app.delete('/test')
      public deleteTest() {
        return { result: 'delete-test' };
      }

      @app.head('/test')
      public headTest() {
        return { result: 'head-test' };
      }

      @app.options('/test')
      public optionsTest() {
        return { result: 'options-test' };
      }

      public handler = createHandler(app);
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
        createEvent('/test', method),
        context
      );
      // Assess
      expect(actual.statusCode).toBe(200);
      expect(actual.body).toBe(JSON.stringify(expected));
      expect(actual.headers?.['content-type']).toBe('application/json');
      expect(actual.isBase64Encoded).toBe(false);
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
        public getTest() {
          executionOrder.push('handler');
          return { result: `${this.scope}: decorator-with-middleware` };
        }

        public handler = createHandlerWithScope(app, this);
      }

      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(createEvent('/test', 'GET'), context);

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
          public getTest() {
            return { result: 'get-decorator-middleware' };
          }

          @app.post('/test', [middleware])
          public postTest() {
            return { result: 'post-decorator-middleware' };
          }

          @app.put('/test', [middleware])
          public putTest() {
            return { result: 'put-decorator-middleware' };
          }

          @app.patch('/test', [middleware])
          public patchTest() {
            return { result: 'patch-decorator-middleware' };
          }

          @app.delete('/test', [middleware])
          public deleteTest() {
            return { result: 'delete-decorator-middleware' };
          }

          @app.head('/test', [middleware])
          public headTest() {
            return { result: 'head-decorator-middleware' };
          }

          @app.options('/test', [middleware])
          public optionsTest() {
            return { result: 'options-decorator-middleware' };
          }

          public handler = createHandler(app);
        }

        const lambda = new Lambda();

        // Act
        const result = await lambda.handler(
          createEvent('/test', method),
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
        public handleBadRequest(error: BadRequestError) {
          return {
            statusCode: HttpStatusCodes.BAD_REQUEST,
            error: 'Bad Request',
            message: `Decorated: ${error.message}`,
          };
        }

        @app.get('/test')
        public getTest() {
          throw new BadRequestError('test error');
        }

        public handler = createHandler(app);
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(createEvent('/test', 'GET'), context);

      // Assess
      expect(result).toEqual({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        body: JSON.stringify({
          statusCode: HttpStatusCodes.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Decorated: test error',
        }),
        headers: { 'content-type': 'application/json' },
        isBase64Encoded: false,
      });
    });

    it('works with notFound decorator and preserves scope', async () => {
      // Prepare
      const app = new Router();

      class Lambda {
        public scope = 'scoped';

        @app.notFound()
        public handleNotFound(error: NotFoundError) {
          return {
            statusCode: HttpStatusCodes.NOT_FOUND,
            error: 'Not Found',
            message: `${this.scope}: ${error.message}`,
          };
        }

        public handler = createHandlerWithScope(app, this);
      }

      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(createEvent('/nonexistent', 'GET'), context);

      // Assess
      expect(result).toEqual({
        statusCode: HttpStatusCodes.NOT_FOUND,
        body: JSON.stringify({
          statusCode: HttpStatusCodes.NOT_FOUND,
          error: 'Not Found',
          message: 'scoped: Route /nonexistent for method GET not found',
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
        public handleMethodNotAllowed(error: MethodNotAllowedError) {
          return {
            statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
            error: 'Method Not Allowed',
            message: `Decorated: ${error.message}`,
          };
        }

        @app.get('/test')
        public getTest() {
          throw new MethodNotAllowedError('POST not allowed');
        }

        public handler = createHandler(app);
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(createEvent('/test', 'GET'), context);

      // Assess
      expect(result).toEqual({
        statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
        body: JSON.stringify({
          statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
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
        public handleBadRequest(error: BadRequestError) {
          return {
            statusCode: HttpStatusCodes.BAD_REQUEST,
            error: 'Bad Request',
            message: `${this.scope}: ${error.message}`,
          };
        }

        @app.get('/test')
        public getTest() {
          throw new BadRequestError('test error');
        }

        public handler = createHandlerWithScope(app, this);
      }

      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(createEvent('/test', 'GET'), context);

      // Assess
      expect(result).toEqual({
        statusCode: HttpStatusCodes.BAD_REQUEST,
        body: JSON.stringify({
          statusCode: HttpStatusCodes.BAD_REQUEST,
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
      const testEvent = createEvent('/test', 'GET');

      class Lambda {
        @app.get('/test')
        public getTest(reqCtx: RequestContext) {
          return {
            hasRequest: reqCtx.req instanceof Request,
            hasEvent: reqCtx.event === testEvent,
            hasContext: reqCtx.context === context,
          };
        }

        public handler = createHandler(app);
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(testEvent, context);
      const actual = JSON.parse(result.body ?? '{}');

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
        public handleBadRequest(
          error: BadRequestError,
          reqCtx: RequestContext
        ) {
          return {
            statusCode: HttpStatusCodes.BAD_REQUEST,
            error: 'Bad Request',
            message: error.message,
            hasRequest: reqCtx.req instanceof Request,
            hasEvent: reqCtx.event === testEvent,
            hasContext: reqCtx.context === context,
          };
        }

        @app.get('/test')
        public getTest() {
          throw new BadRequestError('test error');
        }

        public handler = createHandler(app);
      }

      const lambda = new Lambda();

      // Act
      const result = await lambda.handler(testEvent, context);
      const body = JSON.parse(result.body);

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
        public getTest() {
          return {
            message: `${this.scope}: success`,
          };
        }

        public handler = createHandlerWithScope(app, this);
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

  describe('streaming with decorators', () => {
    it('preserves scope when using resolveStream with decorators', async () => {
      // Prepare
      const app = new Router();

      class Lambda {
        public scope = 'streaming-scope';

        @app.get('/test')
        public getTest() {
          return {
            message: `${this.scope}: streaming success`,
          };
        }

        public handler = createStreamHandler(app, this);
      }

      const lambda = new Lambda();
      const responseStream = new MockResponseStream();
      const handler = lambda.handler.bind(lambda);

      // Act
      await handler(createTestEvent('/test', 'GET'), context, responseStream);

      // Assess
      const { prelude, body } = parseStreamOutput(responseStream.chunks);
      expect(prelude.statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual({
        message: 'streaming-scope: streaming success',
      });
    });

    it('preserves scope when handler throws error in streaming', async () => {
      // Prepare
      const app = new Router();

      class Lambda {
        public scope = 'error-scope';

        @app.errorHandler(UnauthorizedError)
        public handleUnauthorized(error: UnauthorizedError) {
          return {
            statusCode: HttpStatusCodes.UNAUTHORIZED,
            error: 'Unauthorized',
            message: `${this.scope}: ${error.message}`,
          };
        }

        @app.get('/test')
        public getTest() {
          throw new UnauthorizedError('UnauthorizedError!');
        }

        public handler = createStreamHandler(app, this);
      }

      const lambda = new Lambda();
      const responseStream = new MockResponseStream();
      const handler = lambda.handler.bind(lambda);

      // Act
      await handler(createTestEvent('/test', 'GET'), context, responseStream);

      // Assess
      const { prelude, body } = parseStreamOutput(responseStream.chunks);
      expect(prelude.statusCode).toBe(401);
      expect(JSON.parse(body)).toEqual({
        statusCode: HttpStatusCodes.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'error-scope: UnauthorizedError!',
      });
    });
  });
});
