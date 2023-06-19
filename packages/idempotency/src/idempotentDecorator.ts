import {
  GenericTempRecord,
  IdempotencyFunctionOptions,
  IdempotencyLambdaHandlerOptions,
} from './types';
import { IdempotencyHandler } from './IdempotencyHandler';
import { IdempotencyConfig } from './IdempotencyConfig';

/**
 * use this function to narrow the type of options between IdempotencyHandlerOptions and IdempotencyFunctionOptions
 * @param options
 */
const isFunctionOption = (
  options: IdempotencyLambdaHandlerOptions | IdempotencyFunctionOptions
): boolean =>
  (options as IdempotencyFunctionOptions).dataKeywordArgument !== undefined;

const idempotent = function (
  options: IdempotencyLambdaHandlerOptions | IdempotencyFunctionOptions
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const childFunction = descriptor.value;
    descriptor.value = function (record: GenericTempRecord) {
      const functionPayloadtoBeHashed = isFunctionOption(options)
        ? record[(options as IdempotencyFunctionOptions).dataKeywordArgument]
        : record;
      const idempotencyConfig = options.config
        ? options.config
        : new IdempotencyConfig({});
      const idempotencyHandler = new IdempotencyHandler<GenericTempRecord>({
        functionToMakeIdempotent: childFunction,
        functionPayloadToBeHashed: functionPayloadtoBeHashed,
        persistenceStore: options.persistenceStore,
        idempotencyConfig: idempotencyConfig,
        fullFunctionPayload: record,
      });

      return idempotencyHandler.handle();
    };

    return descriptor;
  };
};

/**
 * Use this decorator to make your lambda handler itempotent.
 * You need to provide a peristance layer to store the idempotency information.
 * At the moment we only support `DynamodbPersistenceLayer`.
 * > **Note**:
 * > decorators are an exeperimental feature in typescript and may change in the future.
 * > To enable decoratopr support in your project, you need to enable the `experimentalDecorators` compiler option in your tsconfig.json file.
 * @example
 * ```ts
 * import {
 *   DynamoDBPersistenceLayer,
 *   idempotentLambdaHandler
 * } from '@aws-lambda-powertools/idempotency'
 *
 * class MyLambdaFunction {
 *   @idempotentLambdaHandler({ persistenceStore: new DynamoDBPersistenceLayer() })
 *   async handler(event: any, context: any) {
 *     return "Hello World";
 *   }
 * }
 * export myLambdaHandler new MyLambdaFunction();
 * export const handler = myLambdaHandler.handler.bind(myLambdaHandler);
 * ```
 * @see {@link DynamoDBPersistenceLayer}
 * @see https://www.typescriptlang.org/docs/handbook/decorators.html
 */
const idempotentLambdaHandler = function (
  options: IdempotencyLambdaHandlerOptions
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor {
  return idempotent(options);
};
/**
 * Use this decorator to make any class function idempotent.
 * Similar to the `idempotentLambdaHandler` decorator, you need to provide a persistence layer to store the idempotency information.
 * @example
 * ```ts
 * import {
 *  DynamoDBPersistenceLayer,
 *  idempotentFunction
 *  } from '@aws-lambda-powertools/idempotency'
 *
 *  class MyClass {
 *
 *  public async handler(_event: any, _context: any) {
 *    for(const record of _event.records){
 *      await this.process(record);
 *      }
 *    }
 *
 *  @idempotentFunction({ persistenceStore: new DynamoDBPersistenceLayer() })
 *  public async process(record: Record<stiring, unknown) {
 *     // do some processing
 *  }
 *  ```
 *  @see {@link DynamoDBPersistenceLayer}
 * @param options
 */
const idempotentFunction = function (
  options: IdempotencyFunctionOptions
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor {
  return idempotent(options);
};

export { idempotentLambdaHandler, idempotentFunction };
