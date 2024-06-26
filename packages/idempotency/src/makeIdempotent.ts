import type { Context, Handler } from 'aws-lambda';
import type {
  AnyFunction,
  ItempotentFunctionOptions,
  IdempotencyLambdaHandlerOptions,
} from './types/IdempotencyOptions.js';
import { IdempotencyHandler } from './IdempotencyHandler.js';
import { IdempotencyConfig } from './IdempotencyConfig.js';

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
 * const processIdempotently = makeIdempotent(processRecord, {
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
/* const makeIdempotent = <Func extends AnyFunction>(
  fn: Func,
  options: ItempotentFunctionOptions<Parameters<Func>>,
  thisArg: Handler
): ((...args: Parameters<Func>) => ReturnType<Func>) => {
  const { persistenceStore, config } = options;
  const idempotencyConfig = config ? config : new IdempotencyConfig({});

  if (!idempotencyConfig.isEnabled()) return fn;

  return (...args: Parameters<Func>): ReturnType<Func> => {
    let functionPayloadToBeHashed;

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
      functionArguments: args,
      functionPayloadToBeHashed,
      thisArg,
    }).handle() as ReturnType<Func>;
  };
}; */
// eslint-disable-next-line func-style
function makeIdempotent<Func extends AnyFunction>(
  fn: Func,
  options: ItempotentFunctionOptions<Parameters<Func>>
): (...args: Parameters<Func>) => ReturnType<Func> {
  const { persistenceStore, config } = options;
  const idempotencyConfig = config ? config : new IdempotencyConfig({});

  if (!idempotencyConfig.isEnabled()) return fn;

  return function (...args: Parameters<Func>): ReturnType<Func> {
    let functionPayloadToBeHashed;

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
      functionArguments: args,
      functionPayloadToBeHashed,
      // @ts-expect-error abc
      thisArg: this,
    }).handle() as ReturnType<Func>;
  };
}

export { makeIdempotent };
