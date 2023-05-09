import { GenericTempRecord, IdempotentOptions, } from './types';
import { IdempotencyHandler } from './IdempotencyHandler';
import { IdempotencyConfig } from './IdempotencyConfig';

const idempotent = function (options: IdempotentOptions) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const childFunction = descriptor.value;
    // TODO: sort out the type for this

    descriptor.value = function (record: GenericTempRecord) {
      const config = options.config || new IdempotencyConfig({});
      const dataKeywordArgument = options?.dataKeywordArgument ? record[options?.dataKeywordArgument] : record;
      config.registerLambdaContext(record.context);
      const idempotencyHandler = new IdempotencyHandler<GenericTempRecord>(
        childFunction,
        dataKeywordArgument,
        config,
        options.persistenceStore,
        record);

      return idempotencyHandler.handle();
    };

    return descriptor;
  };
};

export { idempotent };
