import type {
  GenericTempRecord,
  IdempotencyOptions,
  AnyFunctionWithRecord,
  AnyIdempotentFunction,
} from './types';
import { IdempotencyHandler } from './IdempotencyHandler';

const makeFunctionIdempotent = function <U>(
  fn: AnyFunctionWithRecord<U>,
  options: IdempotencyOptions
): AnyIdempotentFunction<U> {
  const wrappedFn: AnyIdempotentFunction<U> = function (record: GenericTempRecord): Promise<U> {
    const idempotencyHandler: IdempotencyHandler<U> = new IdempotencyHandler<U>(fn, record[options.dataKeywordArgument], options, record);

    return idempotencyHandler.handle();
  };

  return wrappedFn;
};

export { makeFunctionIdempotent };
