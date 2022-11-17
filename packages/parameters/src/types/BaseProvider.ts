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

interface ExpirableValueInterface {
  value: string | Record<string, unknown>
  ttl: number
}

interface BaseProviderInterface {
  get(name: string, options?: GetOptionsInterface): Promise<undefined | string | Record<string, unknown>>
  getMultiple(path: string, options?: GetMultipleOptionsInterface): Promise<void | Record<string, unknown>>
}

export {
  GetOptionsInterface,
  GetMultipleOptionsInterface,
  BaseProviderInterface,
  ExpirableValueInterface,
  TransformOptions,
};