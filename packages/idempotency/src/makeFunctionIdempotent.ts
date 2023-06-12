import type { Context } from 'aws-lambda';
import type {
  AnyFunctionWithRecord,
  AnyIdempotentFunction,
  IdempotencyFunctionOptions,
} from './types';
import { IdempotencyHandler } from './IdempotencyHandler';
import { IdempotencyConfig } from './IdempotencyConfig';

const isContext = (arg: unknown): arg is Context => {
  return (
    arg !== undefined &&
    arg !== null &&
    typeof arg === 'object' &&
    'getRemainingTimeInMillis' in arg
  );
};

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
): AnyIdempotentFunction<U> | AnyFunctionWithRecord<U> {
  const idempotencyConfig = options.config
    ? options.config
    : new IdempotencyConfig({});

  const wrappedFn: AnyIdempotentFunction<U> = function (
    ...args: Parameters<AnyFunctionWithRecord<U>>
  ): Promise<U> {
    const payload = args[0];
    const context = args[1];

    if (options.dataKeywordArgument === undefined) {
      throw new Error(
        `Missing data keyword argument ${options.dataKeywordArgument}`
      );
    }
    if (isContext(context)) {
      idempotencyConfig.registerLambdaContext(context);
    }
    const idempotencyHandler: IdempotencyHandler<U> = new IdempotencyHandler<U>(
      {
        functionToMakeIdempotent: fn,
        functionPayloadToBeHashed: payload[options.dataKeywordArgument],
        idempotencyConfig: idempotencyConfig,
        persistenceStore: options.persistenceStore,
        fullFunctionPayload: payload,
      }
    );

    return idempotencyHandler.handle();
  };
  if (idempotencyConfig.isEnabled()) return wrappedFn;
  else return fn;
};

export { makeFunctionIdempotent };
