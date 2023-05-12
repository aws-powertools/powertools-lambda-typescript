import type { AnyFunctionWithRecord, AnyIdempotentFunction, GenericTempRecord, IdempotencyFunctionOptions, } from './types';
import { IdempotencyHandler } from './IdempotencyHandler';

const makeFunctionIdempotent = function <U>(
  fn: AnyFunctionWithRecord<U>,
  options: IdempotencyFunctionOptions,
): AnyIdempotentFunction<U> {
  const wrappedFn: AnyIdempotentFunction<U> = function (record: GenericTempRecord): Promise<U> {
    if (options.dataKeywordArgument === undefined) {
      throw new Error(`Missing data keyword argument ${options.dataKeywordArgument}`);
    }
    const idempotencyHandler: IdempotencyHandler<U> = new IdempotencyHandler<U>(
      fn,
      record[options.dataKeywordArgument],
      options.persistenceStore,
      record);

    return idempotencyHandler.handle();
  };

  return wrappedFn;
};

export { makeFunctionIdempotent };
