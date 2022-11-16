type TransformOptions = 'auto' | 'binary' | 'json';

interface GetOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  sdkOptions?: unknown
  transform?: TransformOptions
}

interface GetMultipleOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  sdkOptions?: unknown
  transform?: string
  throwOnTransformError?: boolean
}

interface Key {
  [key: string]: TransformOptions | undefined
}

interface ExpirableValueInterface {
  value: string | Record<string, unknown>
  ttl: number
}

interface BaseProviderInterface {
  get(name: string, options?: GetOptionsInterface): Promise<undefined | string | Record<string, unknown>>
  getMultiple(path: string, options?: GetMultipleOptionsInterface): Promise<void | Record<string, unknown>>
}

type TransformValueFn = {
  (value: string | Uint8Array, transform: TransformOptions, throwOnTransformError?: boolean, key?: string): string | Record<string, unknown> | undefined
  (value: Record<string, unknown>, transform: TransformOptions, throwOnTransformError?: boolean, key?: string): Record<string, unknown>
};

export {
  Key,
  GetOptionsInterface,
  GetMultipleOptionsInterface,
  BaseProviderInterface,
  ExpirableValueInterface,
  TransformOptions,
  TransformValueFn
};