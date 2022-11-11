import type { AnyFunction } from './types/AnyFunction';
import type { IdempotencyOptions } from './types/IdempotencyOptions';

const makeFunctionIdempotent = <U>(
  fn: AnyFunction<U>,
  _options: IdempotencyOptions
  // TODO: revisit this with a more specific type if possible
  /* eslint-disable @typescript-eslint/no-explicit-any */
): (...args: Array<any>) => Promise<U | void> => (...args) => fn(...args);

export { makeFunctionIdempotent };
