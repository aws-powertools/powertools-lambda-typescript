import type { Handler } from 'aws-lambda';
import { makeIdempotent } from './makeIdempotent.js';
import type {
  AnyFunction,
  ItempotentFunctionOptions,
} from './types/IdempotencyOptions.js';

/**
 * Use this decorator to make your lambda handler itempotent.
 * You need to provide a peristance layer to store the idempotency information.
 * At the moment we only support `DynamodbPersistenceLayer`.
 *
 * @example
 * ```ts
 * import {
 *   DynamoDBPersistenceLayer,
 *   idempotentLambdaHandler
 * } from '@aws-lambda-powertools/idempotency';
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 *
 * class MyLambdaFunction implements LambdaInterface {
 *   ⁣@idempotent({ persistenceStore: new DynamoDBPersistenceLayer() })
 *   async handler(event: unknown, _context: unknown) {
 *     return "Hello World";
 *   }
 * }
 * export myLambdaHandler new MyLambdaFunction();
 * export const handler = myLambdaHandler.handler.bind(myLambdaHandler);
 * ```
 *
 * Similar to decoratoring a handler you can use the decorator on any other function.
 * @example
 * ```ts
 * import {
 *   DynamoDBPersistenceLayer,
 *   idempotentFunction
 * } from '@aws-lambda-powertools/idempotency';
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 *
 * class MyClass implements LambdaInterface {
 *   public async handler(event: unknown, _context: unknown) {
 *     for(const record of event.records){
 *       await this.process(record);
 *     }
 *   }
 *
 *   ⁣@idemptent({ persistenceStore: new DynamoDBPersistenceLayer() })
 *   public async process(record: Record<stiring, unknown>) {
 *     // do some processing
 *   }
 * }
 * ```
 *
 * @param options - Options to configure the idempotency behavior
 * @see {@link persistence/DynamoDBPersistenceLayer.DynamoDBPersistenceLayer | DynamoDBPersistenceLayer}
 * @see https://www.typescriptlang.org/docs/handbook/decorators.html
 */
const idempotent = (
  options: ItempotentFunctionOptions<Parameters<AnyFunction>>
): ((
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor) => {
  // biome-ignore lint/complexity/useArrowFunction: this is a decorator function and we need to maintain the `this` context
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const childFunction = descriptor.value;

    descriptor.value = async function (this: Handler, ...args: unknown[]) {
      return makeIdempotent(childFunction, options).bind(this)(...args);
    };

    return descriptor;
  };
};

export { idempotent };
