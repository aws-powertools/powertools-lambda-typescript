type TransformOptions = 'auto' | 'binary' | 'json';

interface GetOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  sdkOptions?: unknown
  transform?: TransformOptions
}

interface GetMultipleOptionsInterface extends GetOptionsInterface {
  throwOnTransformError?: boolean
}

interface ExpirableValueInterface {
  value: string | Uint8Array | Record<string, unknown>
  ttl: number
}

interface BaseProviderInterface {
  get(name: string, options?: GetOptionsInterface): Promise<undefined | string | Uint8Array | Record<string, unknown>>
  getMultiple(path: string, options?: GetMultipleOptionsInterface): Promise<void | Record<string, unknown>>
}

export type {
  GetOptionsInterface,
  GetMultipleOptionsInterface,
  BaseProviderInterface,
  ExpirableValueInterface,
  TransformOptions,
};