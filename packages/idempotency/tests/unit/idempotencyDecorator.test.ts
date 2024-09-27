import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { idempotent } from '../../src/index.js';
import { PersistenceLayerTestClass } from '../helpers/idempotencyUtils.js';

describe('Given a class with a function to decorate', () => {
  it('maintains the scope of the decorated function', async () => {
    // Prepare
    class TestClass implements LambdaInterface {
      private readonly foo = 'foo';

      @idempotent({
        persistenceStore: new PersistenceLayerTestClass(),
      })
      public async handler(
        _event: unknown,
        _context: Context
      ): Promise<string> {
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
});
