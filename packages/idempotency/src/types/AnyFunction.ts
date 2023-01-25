// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunctionWithRecord<U> = (record: Record<string,any>) => Promise<U> | U;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyIdempotentFunction<U> = (record: Record<string,any>) => Promise<U>;

export {
  // AnyFunction,
  AnyFunctionWithRecord,
  AnyIdempotentFunction
};