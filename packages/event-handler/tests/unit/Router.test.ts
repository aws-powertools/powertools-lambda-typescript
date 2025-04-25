import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Router } from '../../src/appsync-events/index.js';

describe('Class: Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers resolvers using the functional approach', () => {
    // Prepare
    const router = new Router({ logger: console });
    const foo = vi.fn(() => [true]);
    const bar = vi.fn(async () => true);

    // Act
    router.onPublish('/foo', foo, { aggregate: true });
    router.onSubscribe('/bar', bar);

    // Assess
    expect(console.debug).toHaveBeenNthCalledWith(
      1,
      `Registering onPublish route handler for path '/foo' with aggregate 'true'`
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      2,
      `Registering onSubscribe route handler for path '/bar' with aggregate 'false'`
    );
  });

  it('registers resolvers using the decorator pattern', () => {
    // Prepare
    const router = new Router({ logger: console });

    // Act
    class Lambda {
      readonly prop = 'value';

      @router.onPublish('/foo')
      public foo() {
        return `${this.prop} foo`;
      }

      @router.onSubscribe('/bar')
      public bar() {
        return `${this.prop} bar`;
      }

      @router.onPublish('/baz/*', { aggregate: true })
      public baz() {
        return `${this.prop} baz`;
      }
    }
    const lambda = new Lambda();
    const res1 = lambda.foo();
    const res2 = lambda.bar();
    const res3 = lambda.baz();

    // Assess
    expect(console.debug).toHaveBeenNthCalledWith(
      1,
      `Registering onPublish route handler for path '/foo' with aggregate 'false'`
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      2,
      `Registering onSubscribe route handler for path '/bar' with aggregate 'false'`
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      3,
      `Registering onPublish route handler for path '/baz/*' with aggregate 'true'`
    );
    // verify that class scope is preserved after decorating
    expect(res1).toBe('value foo');
    expect(res2).toBe('value bar');
    expect(res3).toBe('value baz');
  });

  it('uses a default logger with only warnings if none is provided', () => {
    // Prepare
    const router = new Router();

    // Act
    router.onPublish('/foo', vi.fn());

    // Assess
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('emits debug messages when ALC_LOG_LEVEL is set to DEBUG', () => {
    // Prepare
    process.env.AWS_LAMBDA_LOG_LEVEL = 'DEBUG';
    const router = new Router();

    // Act
    router.onPublish('/foo', vi.fn());

    // Assess
    expect(console.debug).toHaveBeenCalled();
    process.env.AWS_LAMBDA_LOG_LEVEL = undefined;
  });
});
