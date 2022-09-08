// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction<U> = (...args: Array<any>) => Promise<U>;

export {
  AnyFunction
};