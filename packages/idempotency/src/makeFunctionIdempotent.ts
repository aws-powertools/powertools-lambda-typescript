/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyFunctionWithRecord, AnyIdempotencyFunction } from './types/AnyFunction';
import { IdempotencyOptions } from './IdempotencyOptions';
import { IdempotencyHandler } from './IdempotencyHandler';

const makeFunctionIdempotent = function<U>(
  fn: AnyFunctionWithRecord<U>,
  options: IdempotencyOptions
): AnyIdempotencyFunction<U>{
  const wrappedFunction: AnyIdempotencyFunction<U> = function(record: Record<string, any>): Promise<U> {
    //TODO: need to find out what we are doing to par down the "payload" - have an open question out: https://github.com/awslabs/aws-lambda-powertools-typescript/issues/447#issuecomment-1344622163
    const idempotencyHandler: IdempotencyHandler<U> = new IdempotencyHandler<U>(fn,record , options, [record]);
    
    return idempotencyHandler.process_idempotency();
  };

  return wrappedFunction;
};

export { makeFunctionIdempotent };
