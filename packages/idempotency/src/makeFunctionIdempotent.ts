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
