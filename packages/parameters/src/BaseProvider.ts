import { isNullOrUndefined, isRecord, isString } from './utils';
import { isUint8Array } from 'node:util/types';
import { fromBase64 } from '@aws-sdk/util-base64-node';
import { GetOptions } from './GetOptions';
import { GetMultipleOptions } from './GetMultipleOptions';
import { ExpirableValue } from './ExpirableValue';
import { TRANSFORM_METHOD_BINARY, TRANSFORM_METHOD_JSON } from './constants';
import { GetParameterError, TransformParameterError } from './Exceptions';
import { EnvironmentVariablesService } from './config/EnvironmentVariablesService';
import type {
  BaseProviderInterface,
  GetMultipleOptionsInterface,
  GetOptionsInterface,
  JSONValue,
  TransformOptions,
} from './types';

// These providers are dinamycally intialized on first use of the helper functions
const DEFAULT_PROVIDERS: Record<string, BaseProvider> = {};

/**
 * Base class for all providers.
 *
 * As an abstract class, it should not be used directly, but rather extended by other providers.
 *
 * It implements the common logic for all providers, such as caching, transformation, etc.
 * Each provider that extends this class must implement the `_get` and `_getMultiple` abstract methods.
 *
 * These methods are responsible for retrieving the values from the underlying parameter store. They are
 * called by the `get` and `getMultiple` methods, which are responsible for caching and transformation.
 *
 * If there are multiple calls to the same parameter but in a different transform, they will be stored multiple times.
 * This allows us to optimize by transforming the data only once per retrieval, thus there is no need to transform cached values multiple times.
 *
 * However, this means that we need to make multiple calls to the underlying parameter store if we need to return it in different transforms.
 *
 * Since the number of supported transform is small and the probability that a given parameter will always be used in a specific transform,
 * this should be an acceptable tradeoff.
 */
abstract class BaseProvider implements BaseProviderInterface {
  public envVarsService: EnvironmentVariablesService;
  protected store: Map<string, ExpirableValue>;

  public constructor() {
    this.store = new Map();
    this.envVarsService = new EnvironmentVariablesService();
  }

  /**
   * Add a value to the cache.
   *
   * @param {string} key - Key of the cached value
   * @param {string | Uint8Array | Record<string, unknown>} value - Value to be cached
   * @param {number} maxAge - Maximum age in seconds for the value to be cached
   */
  public addToCache(key: string, value: unknown, maxAge: number): void {
    if (maxAge <= 0) return;

    this.store.set(key, new ExpirableValue(value, maxAge));
  }

  /**
   * Clear the cache.
   */
  public clearCache(): void {
    this.store.clear();
  }

  /**
   * Retrieve a parameter value or return the cached value.
   *
   * @param {string} name - Parameter name
   * @param {GetOptionsInterface} options - Options to configure maximum age, trasformation, AWS SDK options, or force fetch
   */
  public async get(
    name: string,
    options?: GetOptionsInterface
  ): Promise<unknown | undefined> {
    const configs = new GetOptions(options, this.envVarsService);
    const key = [name, configs.transform].toString();

    if (!configs.forceFetch && !this.hasKeyExpiredInCache(key)) {
      return this.store.get(key)?.value;
    }

    try {
      let value = await this._get(name, options);

      if (isNullOrUndefined(value)) return undefined;

      if (configs.transform && (isString(value) || isUint8Array(value))) {
        value = transformValue(value, configs.transform, true, name);
      }

      this.addToCache(key, value, configs.maxAge);

      return value;
    } catch (error) {
      if (error instanceof TransformParameterError) throw error;
      throw new GetParameterError((error as Error).message);
    }
  }

  /**
   * Retrieve multiple parameter values or return the cached values.
   *
   * @param {string} path - Parameters path
   * @param {GetMultipleOptionsInterface} options - Options to configure maximum age, trasformation, AWS SDK options, or force fetch
   * @returns
   */
  public async getMultiple(
    path: string,
    options?: GetMultipleOptionsInterface
  ): Promise<unknown> {
    const configs = new GetMultipleOptions(options, this.envVarsService);
    const key = [path, configs.transform].toString();

    if (!configs.forceFetch && !this.hasKeyExpiredInCache(key)) {
      // If the code enters in this block, then the key must exist & not have been expired
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.store.get(key)!.value as Record<string, unknown>;
    }

    let values;
    try {
      values = await this._getMultiple(path, options);
      if (!isRecord(values)) {
        throw new GetParameterError(
          `Expected result to be a Record<string, unknown> but got ${typeof values}`
        );
      }
    } catch (error) {
      throw new GetParameterError((error as Error).message);
    }

    if (configs.transform) {
      for (const [entryKey, entryValue] of Object.entries(values)) {
        if (!(isString(entryValue) || isUint8Array(entryValue))) continue;
        try {
          values[entryKey] = transformValue(
            entryValue,
            configs.transform,
            configs.throwOnTransformError,
            entryKey
          );
        } catch (error) {
          if (configs.throwOnTransformError)
            throw new TransformParameterError(
              configs.transform,
              (error as Error).message
            );
        }
      }
    }

    if (Object.keys(values).length !== 0) {
      this.addToCache(key, values, configs.maxAge);
    }

    return values;
  }

  /**
   * Check whether a key has expired in the cache or not.
   *
   * It returns true if the key is expired or not present in the cache.
   *
   * @param {string} key - Stringified representation of the key to retrieve
   */
  public hasKeyExpiredInCache(key: string): boolean {
    const value = this.store.get(key);
    if (value) return value.isExpired();

    return true;
  }

  /**
   * Retrieve parameter value from the underlying parameter store.
   *
   * @param {string} name - Parameter name
   * @param {unknown} options - Options to pass to the underlying implemented method
   */
  protected abstract _get(name: string, options?: unknown): Promise<unknown>;

  /**
   * Retrieve multiple parameter values from the underlying parameter store.
   *
   * @param {string} path - Parameter name
   * @param {unknown} options - Options to pass to the underlying implementated method
   */
  protected abstract _getMultiple(
    path: string,
    options?: unknown
  ): Promise<Record<string, unknown> | void>;
}

/**
 * Utility function to transform a value.
 *
 * It supports JSON and binary transformations, as well as an 'auto' mode that will try to transform the value based on the key.
 *
 * @param {string | Uint8Array} value - Value to be transformed
 * @param {TransformOptions} transform - Transform to be applied, can be 'json', 'binary', or 'auto'
 * @param {boolean} throwOnTransformError - Whether to throw an error if the transformation fails, when transforming multiple values this can be set to false
 * @param {string} key - Key of the value to be transformed, used to determine the transformation method when using 'auto'
 */
const transformValue = (
  value: string | Uint8Array,
  transform: TransformOptions,
  throwOnTransformError: boolean,
  key: string
): string | JSONValue | Uint8Array | undefined => {
  try {
    const normalizedTransform = transform.toLowerCase();

    if (
      (normalizedTransform === TRANSFORM_METHOD_JSON ||
        (normalizedTransform === 'auto' &&
          key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_JSON}`))) &&
      isString(value)
    ) {
      return JSON.parse(value) as JSONValue;
    } else if (
      (normalizedTransform === TRANSFORM_METHOD_BINARY ||
        (normalizedTransform === 'auto' &&
          key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_BINARY}`))) &&
      (isString(value) || isUint8Array(value))
    ) {
      if (value instanceof Uint8Array) {
        value = new TextDecoder('utf-8').decode(value);
      }

      return new TextDecoder('utf-8').decode(fromBase64(value));
    } else {
      return value;
    }
  } catch (error) {
    if (throwOnTransformError)
      throw new TransformParameterError(transform, (error as Error).message);

    return;
  }
};

/**
 * Utility function to clear all the caches of the default providers.
 *
 * This is useful when you want to clear the cache of all the providers at once, for example during testing.
 */
const clearCaches = (): void => {
  for (const provider of Object.values(DEFAULT_PROVIDERS)) {
    provider.clearCache();
  }
};

export {
  BaseProvider,
  ExpirableValue,
  transformValue,
  DEFAULT_PROVIDERS,
  clearCaches,
};
