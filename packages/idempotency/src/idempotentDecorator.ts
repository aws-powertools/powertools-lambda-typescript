/* eslint-disable @typescript-eslint/no-explicit-any */
import { IdempotencyOptions } from './types/IdempotencyOptions';
import { IdempotencyHandler } from './IdempotencyHandler';

const idempotent = function (options: IdempotencyOptions) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const childFunction = descriptor.value;
    descriptor.value = function(record: Record<string, any>){
      const idempotencyHandler: IdempotencyHandler<unknown> = new IdempotencyHandler<unknown>(childFunction, record[options.dataKeywordArgument], options, record);
        
      return idempotencyHandler.processIdempotency();
    };
  
    return descriptor;
  }; 
};
  
export { idempotent };
  