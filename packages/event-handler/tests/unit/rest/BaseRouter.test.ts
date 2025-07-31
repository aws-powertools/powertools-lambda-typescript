import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseRouter } from '../../../src/rest/BaseRouter.js';
import { HttpVerbs } from '../../../src/rest/constants.js';
import type {
  HttpMethod,
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

    #isEvent(obj: unknown): asserts obj is { path: string; method: string } {
      if (
        typeof obj !== 'object' ||
        obj === null ||
        !('path' in obj) ||
        !('method' in obj)
      ) {
        throw new Error('Invalid event object');
      }
    }

    public resolve(event: unknown, context: Context): Promise<unknown> {
      this.#isEvent(event);
      const { method, path } = event;
      const routes = this.routeRegistry.getRoutesByMethod(method);
      const route = routes.find((x) => x.path === path);
      if (route == null) throw new Error('404');
      return route.handler(event, context);
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
});
