import type { AnyFunctionWithRecord, AnyIdempotentFunction, GenericTempRecord, IdempotencyOptions, } from './types';
import { IdempotencyHandler } from './IdempotencyHandler';
import { IdempotencyConfig } from './IdempotencyConfig';

const makeFunctionIdempotent = function <U>(
  fn: AnyFunctionWithRecord<U>,
  options: IdempotencyOptions,
): AnyIdempotentFunction<U> {
  const wrappedFn: AnyIdempotentFunction<U> = function (record: GenericTempRecord): Promise<U> {
    if (options.dataKeywordArgument === undefined) {
      throw new Error(`Missing data keyword argument ${options.dataKeywordArgument}`);
    }
    const config = new IdempotencyConfig({});
    const idempotencyHandler: IdempotencyHandler<U> = new IdempotencyHandler<U>(
      fn,
      record[options.dataKeywordArgument],
      config,
      options.persistenceStore,
      record);

    return idempotencyHandler.handle();
  };

  return wrappedFn;
};

export { makeFunctionIdempotent };
