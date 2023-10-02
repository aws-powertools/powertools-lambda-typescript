/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
/**
 * Test Logger class
 *
 * @group unit/event-handler/class/corsconfig/all
 */
import {
  ApiGatewayResolver,
  ProxyEventType,
  ResponseBuilder,
  Router,
} from '../../src/ApiGateway';
import { Response } from '../../src/types/Response';
import { AsyncFunction, CORSConfig, JSONData, Route } from '../../src/types';
import { Middleware } from '../../src/middleware';

describe('Class: ApiGateway', () => {
  let app: ApiGatewayResolver;
  const testFunc: AsyncFunction<Response> = (
    ..._args: unknown[]
  ): Promise<Response> => Promise.resolve(new Response(200));

  beforeAll(() => {
    app = new ApiGatewayResolver();
  });

  describe.each([
    ['GET', '/', '/', 200],
    ['GET', '/single', '/single', 200],
    ['GET', '/two/paths', '/two/paths', 200],
    ['GET', '/multiple/paths/in/url', '/multiple/paths/in/url', 200],
    ['GET', '/test', '/invalid/url', 404],
    ['POST', '/single', '/single', 200],
    ['PUT', '/single', '/single', 200],
    ['PATCH', '/single', '/single', 200],
    ['DELETE', '/single', '/single', 200],
    ['GET', '/single/<single_id>', '/single/1234', 200, { single_id: '1234' }],
    ['GET', '/single/test', '/single/test', 200],
    ['GET', '/single/<single_id>', '/invalid/1234', 404],
    [
      'GET',
      '/single/<single_id>/double/<double_id>',
      '/single/1234/double/5678',
      200,
      { single_id: '1234', double_id: '5678' },
    ],
    [
      'GET',
      '/single/<single_id>/double/<double_id>',
      '/single/1234/invalid/5678',
      404,
    ],
    [
      'GET',
      '/single/<single_id>/double/<double_id>',
      '/single/1234/invalid/5678',
      404,
    ],
  ])(
    'Pattern Match:',
    (
      routeMethod: string,
      routeRule: string,
      testPath: string,
      expectedHTTPCode: number,
      expectedPathParams?: { [k: string]: string }
    ) => {
      beforeAll(() => {
        app.addRoute(routeMethod, routeRule, testFunc);
      });
      describe('Feature: Router URL Pattern matching (Manual)', () => {
        test(
          expectedHTTPCode == 200
            ? `should resolve method: ${routeMethod} rule:${routeRule}`
            : `should not resolve invalid path:${routeRule} testPath: ${testPath}`,
          async () => {
            const event = {
              httpMethod: routeMethod,
              path: testPath,
              body: null,
              headers: {},
              isBase64Encoded: false,
              queryStringParameters: null,
              multiValueQueryStringParameters: null,
            } as APIGatewayProxyEvent;

            app
              .resolve(event, {} as Context)
              .then((response) =>
                expect(response?.['statusCode']).toEqual(expectedHTTPCode)
              );
          }
        );
      });

      describe('Feature: Router Path-parameter resolving', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spyCallRoute = jest
          .spyOn(ApiGatewayResolver.prototype as any, 'callRoute')
          .mockImplementation(() => new ResponseBuilder(new Response(200)));

        beforeEach(() => {
          spyCallRoute.mockClear();
        });

        afterAll(() => {
          spyCallRoute.mockReset();
        });

        test(`should resolve path parameters in method: ${routeMethod} rule:${routeRule}`, async () => {
          const event = {
            httpMethod: routeMethod,
            path: testPath,
            body: null,
            headers: {},
            isBase64Encoded: false,
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
          } as APIGatewayProxyEvent;

          await app.resolve(event, {} as Context);
          if (expectedHTTPCode == 200) {
            expect(spyCallRoute).toHaveBeenCalled();
            if (expectedPathParams) {
              expect([...spyCallRoute.mock.calls[0]][3]).toEqual(
                expectedPathParams
              );
            }
          }
        });
      });
    }
  );

  describe.each([
    ['GET', '/', '/', 200],
    ['GET', '/single', '/single', 200],
    ['GET', '/two/paths', '/two/paths', 200],
    ['GET', '/multiple/paths/in/url', '/multiple/paths/in/url', 200],
    ['GET', '/test', '/invalid/url', 404],
    ['POST', '/single', '/single', 200],
    ['PUT', '/single', '/single', 200],
    ['PATCH', '/single', '/single', 200],
    ['DELETE', '/single', '/single', 200],
  ])(
    '(Decorator) Pattern Match:',
    (
      routeMethod: string,
      routeRule: string,
      testPath: string,
      expectedHTTPCode: number,
      expectedPathParams?: { [k: string]: string }
    ) => {
      const app: ApiGatewayResolver = new ApiGatewayResolver();

      beforeAll(() => {
        // app.addRoute(routeMethod, routeRule, testFunc);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestRouter {
          @app.route(routeRule, routeMethod)
          public test(): void {
            0;
          }
        }
      });
      describe('Feature: Router URL Pattern matching (Decorator)', () => {
        test(
          expectedHTTPCode == 200
            ? `should resolve method: ${routeMethod} rule:${routeRule}`
            : `should not resolve invalid path:${routeRule} testPath: ${testPath}`,
          async () => {
            const event = {
              httpMethod: routeMethod,
              path: testPath,
              body: null,
              headers: {},
              isBase64Encoded: false,
              queryStringParameters: null,
              multiValueQueryStringParameters: null,
            } as APIGatewayProxyEvent;

            app
              .resolve(event, {} as Context)
              .then((response) =>
                expect(response?.['statusCode']).toEqual(expectedHTTPCode)
              );
          }
        );
      });

      describe('Feature: Router Path-parameter resolving', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spyCallRoute = jest
          .spyOn(ApiGatewayResolver.prototype as any, 'callRoute')
          .mockImplementation(() => new ResponseBuilder(new Response(200)));

        beforeEach(() => {
          spyCallRoute.mockClear();
        });

        afterAll(() => {
          spyCallRoute.mockReset();
        });

        test(`should resolve path parameters in method: ${routeMethod} rule:${routeRule}`, async () => {
          const event = {
            httpMethod: routeMethod,
            path: testPath,
            body: null,
            headers: {},
            isBase64Encoded: false,
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
          } as APIGatewayProxyEvent;

          await app.resolve(event, {} as Context);
          if (expectedHTTPCode == 200) {
            expect(spyCallRoute).toHaveBeenCalled();
            if (expectedPathParams) {
              expect([...spyCallRoute.mock.calls[0]][3]).toEqual(
                expectedPathParams
              );
            }
          }
        });
      });
    }
  );

  describe('Route Convenient HTTP method decorators test', () => {
    const app: ApiGatewayResolver = new ApiGatewayResolver();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class TestRouter {
      @app.delete('/test')
      public deleteTest(): Response {
        return new Response(200);
      }

      @app.get('/test')
      public getTest(): Response {
        return new Response(200);
      }

      @app.patch('/test')
      public patchTest(): Response {
        return new Response(200);
      }

      @app.post('/test')
      public postTest(): Response {
        return new Response(200);
      }

      @app.put('/test')
      public putTest(): Response {
        return new Response(200);
      }
    }

    describe.each([
      ['GET', '/test', '/test', 200],
      ['POST', '/test', '/test', 200],
      ['PUT', '/test', '/test', 200],
      ['PATCH', '/test', '/test', 200],
      ['DELETE', '/test', '/test', 200],
    ])(
      '(Decorator) Pattern Match:',
      (
        routeMethod: string,
        routeRule: string,
        testPath: string,
        expectedHTTPCode: number
      ) => {
        test(`should resolve ${routeMethod} configured through decorators`, async () => {
          const event = {
            httpMethod: routeMethod,
            path: testPath,
            body: null,
            headers: {},
            isBase64Encoded: false,
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
          } as APIGatewayProxyEvent;

          app
            .resolve(event, {} as Context)
            .then((response) =>
              expect(response?.['statusCode']).toEqual(expectedHTTPCode)
            );
        });
      }
    );
  });

  describe('Feature: Multi-routers resolving', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spyCallRoute = jest
      .spyOn(ApiGatewayResolver.prototype as any, 'callRoute')
      .mockImplementation(() => new ResponseBuilder(new Response(200)));
    let multiRouterApp: ApiGatewayResolver;
    const stripPrefixes = ['/base-path'];
    beforeEach(() => {
      spyCallRoute.mockClear();
      multiRouterApp = new ApiGatewayResolver(
        ProxyEventType.APIGatewayProxyEventV2,
        new CORSConfig('*', ['test_header']),
        false,
        stripPrefixes
      );
    });

    afterEach(() => {
      spyCallRoute.mockReset();
    });

    test(`should resolve path when one router is added to BaseRouter`, async () => {
      const event = {
        httpMethod: 'GET',
        path: '/v1/multi/one',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/multi/one', testFunc);
      const router = new Router();
      router.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl
      );

      multiRouterApp.includeRoutes(router, '/v1');
      multiRouterApp
        .resolve(event, {} as Context)
        .then((response) => expect(response?.['statusCode']).toEqual(200));
    });

    test(`should resolve path when one router is added to BaseRouter with Cors Configuration`, async () => {
      const event = {
        httpMethod: 'GET',
        path: '/v1/multi/one',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/v1/multi/one', testFunc, true);
      multiRouterApp.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl
      );

      multiRouterApp
        .resolve(event, {} as Context)
        .then((response) => expect(response?.['statusCode']).toEqual(200));
    });

    test(`should resolve any path after stripping prefix`, async () => {
      const event = {
        httpMethod: 'GET',
        path: '/base-path/v1/multi/one',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', new RegExp('/multi/one'), testFunc);
      const router = new Router();
      router.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl
      );

      multiRouterApp.includeRoutes(router, '/v1');
      multiRouterApp
        .resolve(event, {} as Context)
        .then((response) => expect(response?.['statusCode']).toEqual(200));
    });

    test(`should resolve base path / after stripping prefix`, async () => {
      const event = {
        httpMethod: 'GET',
        path: '/base-path',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/', testFunc);
      const router = new Router();
      router.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl
      );

      multiRouterApp.includeRoutes(router, '/');
      multiRouterApp
        .resolve(event, {} as Context)
        .then((response) => expect(response?.['statusCode']).toEqual(200));
    });

    test(`should resolve options method`, async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/base-path',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/', testFunc);
      const router = new Router();
      router.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl
      );

      multiRouterApp.includeRoutes(router, '/');
      multiRouterApp
        .resolve(event, {} as Context)
        .then((response) => expect(response?.['statusCode']).toEqual(204))
        .catch((e) => console.log(`error = ${e}`));
    });

    test(`should resolve path when multiple router is added to BaseRouter`, async () => {
      const route = new Route('GET', '/multi/one', testFunc);
      const router_1 = new Router();
      router_1.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl
      );

      const router_2 = new Router();
      router_2.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl
      );

      multiRouterApp.includeRoutes(router_1, '/v1');
      multiRouterApp.includeRoutes(router_2, '/v2');

      const event = {
        httpMethod: 'GET',
        path: '/v1/multi/one',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      multiRouterApp
        .resolve(event, {} as Context)
        .then((response) => expect(response?.['statusCode']).toEqual(200));

      event.path = '/v2/multi/one';
      multiRouterApp.resolve(event, {} as Context).then((response) => {
        expect(response?.['statusCode']).toEqual(200);
      });
    });
  });

  describe('Feature: Middlewares', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spyCallRoute = jest
      .spyOn(ApiGatewayResolver.prototype as any, 'callRoute')
      .mockImplementation(() => new ResponseBuilder(new Response(200)));
    let multiRouterApp: ApiGatewayResolver;
    const stripPrefixes = ['/base-path'];
    beforeEach(() => {
      spyCallRoute.mockClear();
      multiRouterApp = new ApiGatewayResolver(
        ProxyEventType.APIGatewayProxyEventV2,
        new CORSConfig('*', ['test_header']),
        false,
        stripPrefixes
      );
    });

    afterEach(() => {
      spyCallRoute.mockReset();
    });

    test(`should resolve path when one router is added to BaseRouter`, async () => {
      const event = {
        httpMethod: 'GET',
        path: '/v1/multi/one',
        body: null,
        headers: {},
        isBase64Encoded: false,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
      } as APIGatewayProxyEvent;

      const route = new Route('GET', '/multi/one', testFunc);
      const router = new Router();

      const TestMiddleware =
        (): Middleware<JSONData | Response> =>
        async (event, context, args, next): Promise<JSONData | Response> =>
          await next();

      router.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl,
        [TestMiddleware()]
      );

      multiRouterApp.includeRoutes(router, '/v1');
      multiRouterApp
        .resolve(event, {} as Context)
        .then((response) => expect(response?.['statusCode']).toEqual(200));
    });
  });

  describe('Feature: Resolver context', () => {
    let app: ApiGatewayResolver;

    beforeAll(() => {
      app = new ApiGatewayResolver();
    });

    test('should be able to add additional context to resolver', () => {
      app.clearContext();
      app.appendContext(new Map());
      app.appendContext(new Map([['test_context', 'test_value']]));
      app.appendContext(new Map([['test_context', 'test_value']]));
      expect(app.context).toBeDefined();
      app.appendContext(new Map([['add_context', 'add_value']]));
      app.appendContext(new Map());
      app.appendContext(undefined);
      app.clearContext();
    });
  });
});
