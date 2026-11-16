import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { IdempotencyConfig, idempotent } from '../../src/index.js';
import { BasePersistenceLayer } from '../../src/persistence/BasePersistenceLayer.js';
import { PersistenceLayerTestClass } from '../helpers/idempotencyUtils.js';

describe('Given a class with a function to decorate', () => {
  it('maintains the scope of the decorated function', async () => {
    // Prepare
    class TestClass implements LambdaInterface {
      private readonly foo = 'foo';

      @idempotent({
        persistenceStore: new PersistenceLayerTestClass(),
      })
      public async handler(_event: unknown, _context: Context) {
        return this.privateMethod();
      }

      public privateMethod(): string {
        return `private ${this.foo}`;
      }
    }

    const handlerClass = new TestClass();
    const handler = handlerClass.handler.bind(handlerClass);

    // Act
    const result = await handler({}, context);

    // Assess
    expect(result).toBe('private foo');
  });

  it('passes the custom keyPrefix to the persistenceStore', () => {
    // Prepare
    const configureSpy = vi.spyOn(BasePersistenceLayer.prototype, 'configure');
    const idempotencyConfig = new IdempotencyConfig({});

    class TestClass implements LambdaInterface {
      @idempotent({
        persistenceStore: new PersistenceLayerTestClass(),
        config: idempotencyConfig,
        keyPrefix: 'my-custom-prefix',
      })
      public handler(_event: unknown, _context: Context) {
        return true;
      }
    }

    const handlerClass = new TestClass();
    const handler = handlerClass.handler.bind(handlerClass);

    // Act
    const result = handler({}, context);

    // Assess
    expect(result).toBeTruthy();

    expect(configureSpy).toHaveBeenCalled();
    const configureCallArgs = configureSpy.mock.calls[0][0]; // Extract first call's arguments
    expect(configureCallArgs.config).toBe(idempotencyConfig);
    expect(configureCallArgs.keyPrefix).toBe('my-custom-prefix');

    // Restore the spy
    configureSpy.mockRestore();
  });

  it('appends the class and method name to the key prefix of a decorated method', async () => {
    // Prepare
    const persistenceStore = new PersistenceLayerTestClass();
    const config = new IdempotencyConfig({});
    config.registerLambdaContext(context);

    class TestClass {
      @idempotent({ persistenceStore, config })
      public async process(_record: unknown) {
        return true;
      }
    }

    // Act
    await new TestClass().process({ id: 'order-1' });

    // Assess
    const [record] = persistenceStore._putRecord.mock.calls[0];
    expect(record.idempotencyKey).toMatch(
      /^my-lambda-function\.TestClass\.process#/
    );
  });

  it('appends the class and method name to the key prefix of a decorated static method', async () => {
    // Prepare
    const persistenceStore = new PersistenceLayerTestClass();
    const config = new IdempotencyConfig({});
    config.registerLambdaContext(context);

    // biome-ignore lint/complexity/noStaticOnlyClass: the test covers a decorated static method
    class TestClass {
      @idempotent({ persistenceStore, config })
      public static async process(_record: unknown) {
        return true;
      }
    }

    // Act
    await TestClass.process({ id: 'order-1' });

    // Assess
    const [record] = persistenceStore._putRecord.mock.calls[0];
    expect(record.idempotencyKey).toMatch(
      /^my-lambda-function\.TestClass\.process#/
    );
  });

  it('keeps the default key prefix for a decorated handler', async () => {
    // Prepare
    const persistenceStore = new PersistenceLayerTestClass();

    class TestClass implements LambdaInterface {
      @idempotent({ persistenceStore })
      public async handler(_event: unknown, _context: Context) {
        return true;
      }
    }

    // Act
    await new TestClass().handler({ id: 'order-1' }, context);

    // Assess
    const [record] = persistenceStore._putRecord.mock.calls[0];
    expect(record.idempotencyKey).toMatch(/^my-lambda-function#/);
  });
});
