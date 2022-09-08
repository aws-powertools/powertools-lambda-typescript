/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyFunction } from './types/AnyFunction';
import { IdempotencyOptions } from './IdempotencyOptions';

const makeFunctionIdempotent = <U>(
  fn: AnyFunction<U>,
  _options: IdempotencyOptions
): (...args: Array<any>) => Promise<U | void> => (...args) => fn(...args);

export { makeFunctionIdempotent };
