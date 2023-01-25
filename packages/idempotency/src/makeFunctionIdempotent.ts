/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyFunctionWithRecord, AnyIdempotentFunction } from './types/AnyFunction';
import { IdempotencyOptions } from './IdempotencyOptions';
import { IdempotencyHandler } from './IdempotencyHandler';

const makeFunctionIdempotent = function <U>(
  fn: AnyFunctionWithRecord<U>,
  options: IdempotencyOptions
): AnyIdempotentFunction<U> {
  const wrappedFunction: AnyIdempotentFunction<U> = function (record: Record<string, any>): Promise<U> {
    const idempotencyHandler: IdempotencyHandler<U> = new IdempotencyHandler<U>(fn, record[options.dataKeywordArgument], options, record);

    return idempotencyHandler.process_idempotency();
  };

  return wrappedFunction;
};

export { makeFunctionIdempotent };
