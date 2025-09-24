import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { Context, Handler } from 'aws-lambda';
import { IdempotencyConfig } from './IdempotencyConfig.js';
import { IdempotencyHandler } from './IdempotencyHandler.js';
import type {
  AnyFunction,
  IdempotencyLambdaHandlerOptions,
  ItempotentFunctionOptions,
} from './types/IdempotencyOptions.js';

const isContext = (arg: unknown): arg is Context => {
  return (
    arg !== undefined &&
    arg !== null &&
    typeof arg === 'object' &&
    'getRemainingTimeInMillis' in arg
  );
};

const isFnHandler = (
  fn: AnyFunction,
  args: Parameters<AnyFunction>
): fn is Handler => {
  // get arguments of function
  return (
    fn !== undefined &&
    fn !== null &&
    typeof fn === 'function' &&
    isContext(args[1])
  );
};

const isOptionsWithDataIndexArgument = (
  options: unknown
): options is IdempotencyLambdaHandlerOptions & {
  dataIndexArgument: number;
} => {
  return (
    options !== undefined &&
    options !== null &&
    typeof options === 'object' &&
    'dataIndexArgument' in options
  );
};

/**
 * Function wrapper to make any function idempotent.
 *
 * The `makeIdempotent` function is a higher-order function that takes another function and returns a new version of that function with idempotency behavior.
 * This means that if the function is called multiple times with the same input, it will return the same result without re-executing the original function logic.
 *
 * By default, the entire first argument is hashed to create the idempotency key. You can customize this behavior:
 * - Use {@link IdempotencyConfig.eventKeyJmesPath | `eventKeyJmesPath`} to hash only a subset of the payload
 * - Use {@link ItempotentFunctionOptions.dataIndexArgument | `dataIndexArgument`} to hash a different function argument
 *
 *
 * **Using a subset of the payload**
 *
 * @example
 * ```typescript
 * import { makeIdempotent, IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
 * import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
 *
 * const processRecord = (record: Record<string, unknown>): unknown => {
 *   // your processing logic
 *   return result;
 * };
 *
 * const processIdempotently = makeIdempotent(processRecord, {
 *   persistenceStore: new DynamoDBPersistenceLayer({ tableName: 'idempotency-table' }),
 *   config: new IdempotencyConfig({
 *     eventKeyJmesPath: 'transactionId', // hash only this field as idempotency key
 *   }),
 * });
 *
 * export const handler = async (event: { records: Record<string, unknown>[] }) => {
 *  for (const record of event.records) {
 *    // use the idempotent function
 *    const result = await processIdempotently(record);
 *    // ... do something with the result
 *   }
 * };
 *```
 *
 * **Using a different function argument (useful for multi-parameter functions)**
 *
 * @example
 * ```typescript
 * import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
 * import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
 *
 * const processRecord = (record: Record<string, unknown>, userId: string): unknown => {
 *   // your processing logic
 *   return result;
 * };
 *
 * const processIdempotently = makeIdempotent(processRecord, {
 *   persistenceStore: new DynamoDBPersistenceLayer({ tableName: 'idempotency-table' }),
 *   dataIndexArgument: 1, // hash the userId (second argument) instead of first (record)
 * });
 *
 * export const handler = async (event: { records: Record<string,unknown>[]; userId: string }) => {
 *  for (const record of event.records) {
 *    const userId = event.userId;
 *    // use the idempotent function
 *    const result = await processIdempotently(record, userId);
 *    // ... do something with the result
 *   }
 * };
 * ```
 *
 * @param fn - the function to make idempotent
 * @param options - the options to configure the idempotency behavior
 */
function makeIdempotent<Func extends AnyFunction>(
  fn: Func,
  options: ItempotentFunctionOptions<Parameters<Func>>
): (...args: Parameters<Func>) => ReturnType<Func> {
  const { persistenceStore, config, keyPrefix } = options;
  const idempotencyConfig = config ? config : new IdempotencyConfig({});

  if (!idempotencyConfig.isEnabled()) return fn;

  return function (this: Handler, ...args: Parameters<Func>): ReturnType<Func> {
    let functionPayloadToBeHashed: JSONValue;

    if (isFnHandler(fn, args)) {
      idempotencyConfig.registerLambdaContext(args[1]);
      functionPayloadToBeHashed = args[0];
    } else {
      if (isOptionsWithDataIndexArgument(options)) {
        functionPayloadToBeHashed = args[options.dataIndexArgument];
      } else {
        functionPayloadToBeHashed = args[0];
      }
    }

    return new IdempotencyHandler({
      functionToMakeIdempotent: fn,
      idempotencyConfig: idempotencyConfig,
      persistenceStore: persistenceStore,
      keyPrefix: keyPrefix,
      functionArguments: args,
      functionPayloadToBeHashed,
      thisArg: this,
    }).handle() as ReturnType<Func>;
  };
}

export { makeIdempotent };
