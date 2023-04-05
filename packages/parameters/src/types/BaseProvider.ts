/**
 * Type for the transform option.
 */
type TransformOptions = 'auto' | 'binary' | 'json';

/**
 * Options for the `get` method.
 *
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds. Will be applied after the first API call.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {unknown} sdkOptions - Options to pass to the underlying SDK.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json', 'binary', or 'auto'.
 */
interface GetOptionsInterface {
  /**
   * Maximum age of the value in the cache, in seconds.
   */
  maxAge?: number
  /**
   * Force fetch the value from the parameter store, ignoring the cache.
   */
  forceFetch?: boolean
  /**
   * Options to pass to the underlying SDK.
   */
  sdkOptions?: unknown
  /**
   * Transform to be applied, can be `json` or `binary`.
   */
  transform?: Omit<TransformOptions, 'auto'>
}

/**
 * Options for the `getMultiple` method.
 *
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds. Will be applied after the first API call.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {unknown} sdkOptions - Options to pass to the underlying SDK.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json', 'binary', or 'auto'.
 * @property {boolean} throwOnTransformError - Whether to throw an error if a value cannot be transformed.
 */
interface GetMultipleOptionsInterface extends GetOptionsInterface {
  /**
   * Transform to be applied, can be `json`, `binary`, or `auto`.
   */
  transform?: TransformOptions
  /**
   * Whether to throw an error if a value cannot be transformed.
   */
  throwOnTransformError?: boolean
}

/**
 * Interface for a value that can expire.
 */
interface ExpirableValueInterface {
  /**
   * Value of the parameter.
   */
  value: string | Uint8Array | Record<string, unknown>
  /**
   * Expiration timestamp of the value.
   */
  ttl: number
}

/**
 * Interface for a parameter store provider.
 */
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