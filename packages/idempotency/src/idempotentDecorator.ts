import {
  GenericTempRecord,
  IdempotencyOptions,
} from './types';
import { IdempotencyHandler } from './IdempotencyHandler';

const idempotent = function (options: IdempotencyOptions) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const childFunction = descriptor.value;
    // TODO: sort out the type for this
    descriptor.value = function(record: GenericTempRecord){
      const idempotencyHandler = new IdempotencyHandler<GenericTempRecord>(childFunction, record[options.dataKeywordArgument], options, record);

      return idempotencyHandler.handle();
    };

    return descriptor;
  };
};

export { idempotent };
