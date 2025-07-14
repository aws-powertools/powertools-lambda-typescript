import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseRouter } from '../../../src/rest/BaseRouter.js';
import type { ResolveOptions } from '../../../src/types/index.js';
import type {
  RouteHandler,
  RouteOptions,
  RouterOptions,
} from '../../../src/types/rest.js';

describe('Class: BaseRouter', () => {
  class TestResolver extends BaseRouter {
    public readonly handlers: Map<string, RouteHandler> = new Map();

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

    public route(handler: RouteHandler, options: RouteOptions) {
      if (options.path == null || options.method == null)
        throw new Error('path or method cannot be null');
      this.handlers.set(options.path + options.method, handler);
    }

    public resolve(
      event: unknown,
      context: Context,
      options?: ResolveOptions
    ): Promise<unknown> {
      this.#isEvent(event);
      const { method, path } = event;
      const handler = this.handlers.get(path + method);
      if (handler == null) throw new Error('404');
      return handler(event, context);
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
  ])('should route %s requests', async (method, verb) => {
    const app = new TestResolver();
    (
      app[
        verb as 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head'
      ] as Function
    )('test', () => `${verb}-test`);
    const actual = await app.resolve({ path: 'test', method }, context);
    expect(actual).toEqual(`${verb}-test`);
  });

  it('should use console.warn and console,error when logger is not provided', () => {
    new TestResolver();
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('test error');
    expect(console.warn).toHaveBeenCalledWith('test warn');
  });

  it('should use console.debug in DEBUG mode when logger is not provided', () => {
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
    new TestResolver();
    expect(console.debug).toHaveBeenCalledWith('test debug');
    expect(console.error).toHaveBeenCalledWith('test error');
    expect(console.warn).toHaveBeenCalledWith('test warn');
  });

  it('should use custom logger when provided', () => {
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');

    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    new TestResolver({ logger });
    expect(logger.error).toHaveBeenCalledWith('test error');
    expect(logger.warn).toHaveBeenCalledWith('test warn');
    expect(logger.debug).toHaveBeenCalledWith('test debug');
  });

  describe('decorators', () => {
    const app = new TestResolver();

    class Lambda {
      @app.get('test', {})
      public async getTest() {
        return 'get-test';
      }

      @app.post('test')
      public async postTest() {
        return 'post-test';
      }

      @app.put('test')
      public async putTest() {
        return 'put-test';
      }

      @app.patch('test')
      public async patchTest() {
        return 'patch-test';
      }

      @app.delete('test')
      public async deleteTest() {
        return 'delete-test';
      }

      @app.head('test')
      public async headTest() {
        return 'head-test';
      }

      public async handler(event: unknown, context: Context) {
        return app.resolve(event, context, {});
      }
    }

    it.each([
      ['GET', 'get-test'],
      ['POST', 'post-test'],
      ['PUT', 'put-test'],
      ['PATCH', 'patch-test'],
      ['DELETE', 'delete-test'],
      ['HEAD', 'head-test'],
    ])('should route %s requests with decorators', async (method, expected) => {
      const lambda = new Lambda();
      const actual = await lambda.handler({ path: 'test', method }, context);
      expect(actual).toEqual(expected);
    });
  });
});
