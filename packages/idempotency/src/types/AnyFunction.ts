// TODO: Find a better way to type this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericTempRecord = Record<string, any>;

type AnyFunctionWithRecord<U> = (
  payload: GenericTempRecord,
  ...args: unknown[]
) => Promise<U> | U;

type AnyIdempotentFunction<U> = (
  payload: GenericTempRecord,
  ...args: unknown[]
) => Promise<U>;

export { GenericTempRecord, AnyFunctionWithRecord, AnyIdempotentFunction };
