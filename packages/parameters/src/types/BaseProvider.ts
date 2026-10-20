import type { Transform } from '../constants.js';

/**
 * Options for the `BaseProvider` class constructor.
 */
type BaseProviderConstructorOptions = {
  /**
   * AWS SDK v3 client instance to use for operations.
   */
  awsSdkV3Client?: unknown;
  /**
   * Optional configuration to pass during client initialization to customize AWS SDK v3 clients.
   */
  clientConfig?: unknown;
  /**
   * AWS SDK v3 client prototype.
   *
   * If the `awsSdkV3Client` is not provided, this will be used to create a new client.
   */
  awsSdkV3ClientPrototype?: new (
    config?: unknown
  ) => unknown;
};

/**
 * Type for the transform option.
 */
type TransformOptions = (typeof Transform)[keyof typeof Transform];

/**
 * Conditionally appends `| undefined` to the resolved output type of a `get` operation.
 *
 * When the inferred options include `throwOnMissing: true`, the value is guaranteed to be
 * present (a {@link ParameterNotFoundError | `ParameterNotFoundError`} is thrown otherwise),
 * so the output type excludes `undefined`. In every other case the value may be absent and
 * the output type includes `undefined`.
 */
type GetMaybeUndefined<Output, InferredFromOptionsType> =
  InferredFromOptionsType extends { throwOnMissing: true }
    ? Output
    : Output | undefined;

/**
 * Options for the `get` method.
 *
 * @property maxAge - Maximum age of the value in the cache, in seconds. Will be applied after the first API call.
 * @property forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property sdkOptions - Options to pass to the underlying SDK.
 * @property transform - Optional transform to be applied, can be 'json', 'binary', or 'auto'.
 */
interface GetOptionsInterface {
  /**
   * Maximum age of the value in the cache, in seconds.
   */
  maxAge?: number;
  /**
   * Force fetch the value from the parameter store, ignoring the cache.
   */
  forceFetch?: boolean;
  /**
   * Options to pass to the underlying SDK.
   */
  sdkOptions?: unknown;
  /**
   * Transform to be applied, can be `json` or `binary`.
   */
  transform?: Omit<TransformOptions, 'auto'>;
  /**
   * Whether to throw a {@link ParameterNotFoundError | `ParameterNotFoundError`} when the
   * parameter is not found in the store. When set to `true`, the return type is narrowed to
   * exclude `undefined`. Defaults to `false`.
   */
  throwOnMissing?: boolean;
}

/**
 * Options for the `getMultiple` method.
 *
 * @property maxAge - Maximum age of the value in the cache, in seconds. Will be applied after the first API call.
 * @property forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property sdkOptions - Options to pass to the underlying SDK.
 * @property transform - Transform to be applied, can be 'json', 'binary', or 'auto'.
 * @property throwOnTransformError - Whether to throw an error if a value cannot be transformed.
 */
interface GetMultipleOptionsInterface extends GetOptionsInterface {
  /**
   * Transform to be applied, can be `json`, `binary`, or `auto`.
   */
  transform?: TransformOptions;
  /**
   * Whether to throw an error if a value cannot be transformed.
   */
  throwOnTransformError?: boolean;
}

/**
 * Interface for a value that can expire.
 */
interface ExpirableValueInterface {
  /**
   * Value of the parameter.
   */
  value: unknown;
  /**
   * Expiration timestamp of the value.
   */
  ttl: number;
}

/**
 * Interface for a parameter store provider.
 */
interface BaseProviderInterface {
  get(name: string, options?: GetOptionsInterface): Promise<unknown>;
  getMultiple(
    path: string,
    options?: GetMultipleOptionsInterface
  ): Promise<unknown>;
  clearCache?(): void;
}

export type {
  BaseProviderConstructorOptions,
  BaseProviderInterface,
  ExpirableValueInterface,
  GetMaybeUndefined,
  GetMultipleOptionsInterface,
  GetOptionsInterface,
  TransformOptions,
};
