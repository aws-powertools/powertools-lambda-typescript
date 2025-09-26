import type { Callback, Context } from 'aws-lambda';
import { describe, expectTypeOf, it } from 'vitest';
import type { LambdaInterface } from '../../src/types/index.js';

describe('Type: LambdaInterface', () => {
  it('works with a sync handler', () => {
    // Prepare
    class Lambda implements LambdaInterface {
      public handler(_event: unknown, context: Context, _callback: Callback) {
        context.getRemainingTimeInMillis();
        _callback(null, 'Hello World');
      }
    }

    // Act
    const lambda = new Lambda();

    // Assess
    expectTypeOf(lambda).toBeObject();
    expectTypeOf(lambda).toHaveProperty('handler');
    expectTypeOf(lambda.handler).toBeFunction();
  });

  it('works with an async handler', () => {
    // Prepare
    class Lambda implements LambdaInterface {
      public async handler(_event: unknown, context: Context) {
        context.getRemainingTimeInMillis();
        await new Promise((r) => setTimeout(r, 1));
        return 'Hello World';
      }
    }

    // Act
    const lambda = new Lambda();

    // Assess
    expectTypeOf(lambda).toBeObject();
    expectTypeOf(lambda).toHaveProperty('handler');
    expectTypeOf(lambda.handler).toBeFunction();
  });
});
