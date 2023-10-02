import { Router } from '../../src/ApiGateway';
import { AsyncFunction, Route } from '../../src/types';

/**
 * ResponseBuilder tests
 *
 * @group unit/event-handler/class/router/all
 */
describe('Class: Router', () => {
  describe('Feature: Base routing', () => {
    let router: Router;

    beforeEach(() => {
      router = new Router();
    });
    const testFunc: AsyncFunction<string> = (_args: unknown): Promise<string> =>
      Promise.resolve('');
    test('should add a route to the routes list when registering a route declaratively', () => {
      const route = new Route('GET', '/v1/test', testFunc);
      router.registerRoute(
        route.func,
        route.rule as string,
        route.method,
        route.cors,
        route.compress,
        route.cacheControl
      );
      expect(router.routes).toBeDefined();
      expect(router.routes.length).toBeGreaterThan(0);
      expect(router.routes).toEqual(expect.arrayContaining([route]));
    });

    test('should add a route to the routes list when registering a route via decorators', () => {
      class TestRouter {
        @router.route('GET', '/v1/test')
        public testFunc(): Promise<string> {
          return Promise.resolve('');
        }
      }
      const testRouter = new TestRouter();
      const route = new Route('GET', '/v1/test', testRouter.testFunc);
      expect(router.routes).toBeDefined();
      expect(router.routes.length).toBeGreaterThan(0);
      expect(router.routes).toEqual(expect.arrayContaining([route]));
    });
  });
});
