import { GenericTempRecord, IdempotencyFunctionOptions, IdempotencyLambdaHandlerOptions, } from './types';
import { IdempotencyHandler } from './IdempotencyHandler';
import { IdempotencyConfig } from './IdempotencyConfig';

/**
 * use this function to narrow the type of options between IdempotencyHandlerOptions and IdempotencyFunctionOptions
 * @param options
 */
const isFunctionOption = (options: IdempotencyLambdaHandlerOptions | IdempotencyFunctionOptions): boolean => (options as IdempotencyFunctionOptions).dataKeywordArgument !== undefined;

const idempotent = function (options: IdempotencyLambdaHandlerOptions | IdempotencyFunctionOptions): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const childFunction = descriptor.value;
    descriptor.value = function (record: GenericTempRecord) {
      const functionPayloadtoBeHashed = isFunctionOption(options) ? record[(options as IdempotencyFunctionOptions).dataKeywordArgument] : record;
      const idempotencyConfig = options.config ? options.config : new IdempotencyConfig({});
      const idempotencyHandler = new IdempotencyHandler<GenericTempRecord>({
        functionToMakeIdempotent: childFunction,
        functionPayloadToBeHashed: functionPayloadtoBeHashed,
        persistenceStore: options.persistenceStore,
        idempotencyConfig: idempotencyConfig,
        fullFunctionPayload: record
      });

      return idempotencyHandler.handle();
    };

    return descriptor;
  };
};

const idempotentLambdaHandler = function (options: IdempotencyLambdaHandlerOptions): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return idempotent(options);
};
const idempotentFunction = function (options: IdempotencyFunctionOptions): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return idempotent(options);
};

export { idempotentLambdaHandler, idempotentFunction };
