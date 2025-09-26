import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { IdempotencyConfig, idempotent } from '../../src/index.js';
import { BasePersistenceLayer } from '../../src/persistence/BasePersistenceLayer.js';
import { PersistenceLayerTestClass } from '../helpers/idempotencyUtils.js';

describe('Given a class with a function to decorate', () => {
  it('maintains the scope of the decorated function', () => {
    // Prepare
    class TestClass implements LambdaInterface {
      private readonly foo = 'foo';

      @idempotent({
        persistenceStore: new PersistenceLayerTestClass(),
      })
      public handler(_event: unknown, _context: Context) {
        return this.privateMethod();
      }

      public privateMethod(): string {
        return `private ${this.foo}`;
      }
    }

    const handlerClass = new TestClass();
    const handler = handlerClass.handler.bind(handlerClass);

    // Act
    const result = handler({}, context);

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
});
