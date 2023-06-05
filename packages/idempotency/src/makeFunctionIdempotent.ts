import type {
  AnyFunctionWithRecord,
  AnyIdempotentFunction,
  GenericTempRecord,
  IdempotencyFunctionOptions,
} from './types';
import { IdempotencyHandler } from './IdempotencyHandler';
import { IdempotencyConfig } from './IdempotencyConfig';

/**
 * Use function wrapper to make your function idempotent.
 * @example
 * ```ts
 * // this is your processing function with an example record { transactionId: '123', foo: 'bar' }
 * const processRecord = (record: Record<string, unknown>): any => {
 *   // you custom processing logic
 *   return result;
 * };
 *
 * // we use wrapper to make processing function idempotent with DynamoDBPersistenceLayer
 * const processIdempotently = makeFunctionIdempotent(processRecord, {
 *   persistenceStore: new DynamoDBPersistenceLayer()
 *   dataKeywordArgument: 'transactionId', // keyword argument to hash the payload and the result
 * });
 *
 * export const handler = async (
 *   _event: EventRecords,
 *   _context: Context
 * ): Promise<void> => {
 *   for (const record of _event.records) {
 *     const result = await processIdempotently(record);
 *     // do something with the result
 *   }
 *
 *   return Promise.resolve();
 * };
 *
 * ```
 */
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
