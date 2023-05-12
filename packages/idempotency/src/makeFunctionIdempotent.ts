import type {
  AnyFunctionWithRecord,
  AnyIdempotentFunction,
  GenericTempRecord,
  IdempotencyFunctionOptions,
} from './types';
import { IdempotencyHandler } from './IdempotencyHandler';
import { IdempotencyConfig } from './IdempotencyConfig';

const makeFunctionIdempotent = function <U>(
  fn: AnyFunctionWithRecord<U>,
  options: IdempotencyFunctionOptions
): AnyIdempotentFunction<U> {
  const wrappedFn: AnyIdempotentFunction<U> = function (
    record: GenericTempRecord
  ): Promise<U> {
    if (options.dataKeywordArgument === undefined) {
      throw new Error(
        `Missing data keyword argument ${options.dataKeywordArgument}`
      );
    }
    const idempotencyConfig = options.config
      ? options.config
      : new IdempotencyConfig({});
    const idempotencyHandler: IdempotencyHandler<U> = new IdempotencyHandler<U>(
      {
        functionToMakeIdempotent: fn,
        functionPayloadToBeHashed: record[options.dataKeywordArgument],
        idempotencyConfig: idempotencyConfig,
        persistenceStore: options.persistenceStore,
        fullFunctionPayload: record,
      }
    );

    return idempotencyHandler.handle();
  };

  return wrappedFn;
};

export { makeFunctionIdempotent };
