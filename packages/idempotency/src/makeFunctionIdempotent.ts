import { AnyFunction } from 'types/AnyFunction';
import { IdempotencyOptions } from './IdempotencyOptions';

const makeFunctionIdempotent = (
  fn: AnyFunction,
  _options: IdempotencyOptions
): AnyFunction => fn;

export { makeFunctionIdempotent };