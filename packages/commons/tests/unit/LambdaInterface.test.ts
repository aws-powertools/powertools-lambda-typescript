/**
 * Test LambdaInterface interface
 *
 * @group unit/commons/lambdaInterface
 */
import { Handler } from 'aws-lambda';
import { Callback, Context } from 'aws-lambda';
import context from '@aws-lambda-powertools/testing-utils/context';
import type {
  SyncHandler,
  AsyncHandler,
  LambdaInterface,
} from '../../src/types/index.js';

describe('LambdaInterface with arrow function', () => {
  jest.spyOn(console, 'log').mockImplementation();
  test('it compiles when given a callback', async () => {
    class LambdaFunction implements LambdaInterface {
      public handler: SyncHandler<Handler> = async (
        _event: unknown,
        context: Context,
        _callback: Callback
      ) => {
        context.done();
        context.fail(new Error('test Error'));
        context.succeed('test succeed');
        context.getRemainingTimeInMillis();
        _callback(null, 'Hello World');
      };
    }

    new LambdaFunction().handler({}, context, () =>
      console.log('Lambda invoked!')
    );
  });

  test('it compiles when not given a callback', async () => {
    class LambdaFunction implements LambdaInterface {
      public handler: AsyncHandler<Handler> = async (
        _event: unknown,
        context: Context
      ) => {
        context.getRemainingTimeInMillis();
      };
    }

    await new LambdaFunction().handler({}, context);
  });
});

describe('LambdaInterface with standard function', () => {
  test('it compiles when given a callback', async () => {
    class LambdaFunction implements LambdaInterface {
      public handler(
        _event: unknown,
        context: Context,
        _callback: Callback
      ): void {
        context.getRemainingTimeInMillis();
        _callback(null, 'Hello World');
      }
    }

    new LambdaFunction().handler({}, context, () =>
      console.log('Lambda invoked!')
    );
  });

  test('it compiles when not given a callback', async () => {
    class LambdaFunction implements LambdaInterface {
      public async handler(_event: unknown, context: Context): Promise<string> {
        context.getRemainingTimeInMillis();

        return new Promise((resolve) => {
          resolve('test promise');
        });
      }
    }

    await new LambdaFunction().handler({}, context);
  });
});

describe('LambdaInterface with decorator', () => {
  type HandlerMethodDecorator = (
    target: LambdaInterface,
    propertyKey: string | symbol,
    descriptor:
      | TypedPropertyDescriptor<SyncHandler<Handler>>
      | TypedPropertyDescriptor<AsyncHandler<Handler>>
  ) => void;

  class DummyModule {
    public dummyDecorator(): HandlerMethodDecorator {
      return (target, _propertyKey, descriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = async (event, context, callback) => {
          let result: unknown;
          try {
            console.log(`Invoking ${String(_propertyKey)}`);
            result = await originalMethod?.apply(this, [
              event,
              context,
              callback,
            ]);
            console.log(`Invoked ${String(_propertyKey)}`);
          } catch (error) {
            throw error;
          } finally {
            console.log(`Finally from decorator`);
          }

          return result;
        };

        return descriptor;
      };
    }
  }

  const dummyModule = new DummyModule();

  test('decorator without callback compile', async () => {
    // WHEN
    class LambdaFunction implements LambdaInterface {
      @dummyModule.dummyDecorator()
      public async handler(
        _event: unknown,
        context: Context
      ): Promise<unknown> {
        context.getRemainingTimeInMillis();

        return 'test';
      }
    }

    await new LambdaFunction().handler({}, context);
  });

  test('decorator with callback compile', async () => {
    // WHEN
    class LambdaFunction implements LambdaInterface {
      @dummyModule.dummyDecorator()
      public handler(
        _event: unknown,
        context: Context,
        _callback: Callback
      ): void {
        context.getRemainingTimeInMillis();
      }
    }

    new LambdaFunction().handler({}, context, () =>
      console.log('Lambda invoked!')
    );
  });
});
