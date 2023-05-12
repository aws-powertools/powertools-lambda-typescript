import { GenericTempRecord, IdempotencyFunctionOptions, IdempotencyHandlerOptions, } from './types';
import { IdempotencyHandler } from './IdempotencyHandler';

/**
 * use this function to narrow the type of options between IdempotencyHandlerOptions and IdempotencyFunctionOptions
 * @param options
 */
const isFunctionOption = (options: IdempotencyHandlerOptions | IdempotencyFunctionOptions): boolean => (options as IdempotencyFunctionOptions).dataKeywordArgument !== undefined;

const idempotent = function (options: IdempotencyHandlerOptions | IdempotencyFunctionOptions): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const childFunction = descriptor.value;
    descriptor.value = function (record: GenericTempRecord) {
      const functionPayloadtoBeHashed = isFunctionOption(options) ? record[(options as IdempotencyFunctionOptions).dataKeywordArgument] : record;
      const idempotencyHandler = new IdempotencyHandler<GenericTempRecord>(
        childFunction,
        functionPayloadtoBeHashed,
        options.persistenceStore,
        record);

      return idempotencyHandler.handle();
    };

    return descriptor;
  };
};

const idempotentLambdaHandler = function (options: IdempotencyHandlerOptions): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return idempotent(options);
};
const idempotentFunction = function (options: IdempotencyFunctionOptions): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return idempotent(options);
};

export { idempotentLambdaHandler, idempotentFunction };
