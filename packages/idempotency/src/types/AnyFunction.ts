// TODO: Find a better way to type this
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericTempRecord = Record<string, any>;

type AnyFunctionWithRecord<U> = (record: GenericTempRecord) => Promise<U> | U;

type AnyIdempotentFunction<U> = (record: GenericTempRecord) => Promise<U>;

export { GenericTempRecord, AnyFunctionWithRecord, AnyIdempotentFunction };
