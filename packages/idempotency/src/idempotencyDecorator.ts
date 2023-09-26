import type { Context, Handler } from 'aws-lambda';
import {
  AnyFunction,
  IdempotencyLambdaHandlerOptions,
  ItempotentFunctionOptions,
} from './types';
import { IdempotencyHandler } from './IdempotencyHandler';
import { IdempotencyConfig } from './IdempotencyConfig';
import { makeIdempotent } from './makeIdempotent';

const isContext = (arg: unknown): arg is Context => {
  return (
    arg !== undefined &&
    arg !== null &&
    typeof arg === 'object' &&
    'getRemainingTimeInMillis' in arg
  );
};

const isFnHandler = (
  fn: AnyFunction,
  args: Parameters<AnyFunction>
): fn is Handler => {
  // get arguments of function
  return (
    fn !== undefined &&
    fn !== null &&
    typeof fn === 'function' &&
    isContext(args[1])
  );
};

const isOptionsWithDataIndexArgument = (
  options: unknown
): options is IdempotencyLambdaHandlerOptions & {
  dataIndexArgument: number;
} => {
  return (
    options !== undefined &&
    options !== null &&
    typeof options === 'object' &&
    'dataIndexArgument' in options
  );
};

const idempotent = function (
  options: ItempotentFunctionOptions<Parameters<AnyFunction>>
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
    descriptor.value = makeIdempotent(childFunction, options);
    descriptor.value = function (...args: Parameters<AnyFunction>) {
      const { persistenceStore, config } = options;
      const idempotencyConfig = config ? config : new IdempotencyConfig({});

      if (!idempotencyConfig.isEnabled())
        return childFunction.apply(this, args);

      let functionPayloadtoBeHashed;

      if (isFnHandler(childFunction, args)) {
        idempotencyConfig.registerLambdaContext(args[1]);
        functionPayloadtoBeHashed = args[0];
      } else {
        if (isOptionsWithDataIndexArgument(options)) {
          functionPayloadtoBeHashed = args[options.dataIndexArgument];
        } else {
          functionPayloadtoBeHashed = args[0];
        }
      }

      return new IdempotencyHandler({
        functionToMakeIdempotent: childFunction,
        idempotencyConfig: idempotencyConfig,
        persistenceStore: persistenceStore,
        functionArguments: args,
        functionPayloadToBeHashed: functionPayloadtoBeHashed,
      }).handle();
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
// const idempotentLambdaHandler = function (
//   options: IdempotencyLambdaHandlerOptions
// ): (
//   target: unknown,
//   propertyKey: string,
//   descriptor: PropertyDescriptor
// ) => PropertyDescriptor {
//   return idempotent(options);
// };
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
// const idempotentFunction = function (
//   options: ItempotentFunctionOptions<Parameters<AnyFunction>>
// ): (
//   target: unknown,
//   propertyKey: string,
//   descriptor: PropertyDescriptor
// ) => PropertyDescriptor {
//   return idempotent(options);
// };

export { idempotent };
