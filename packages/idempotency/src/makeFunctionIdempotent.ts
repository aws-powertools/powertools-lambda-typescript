/* eslint-disable @typescript-eslint/no-empty-function */
import { IdempotencyOptions } from './IdempotencyOptions';

const makeFunctionIdempotent = <T>(
  _fn: () => T,
  _options: IdempotencyOptions
): void => {};

export { makeFunctionIdempotent };
