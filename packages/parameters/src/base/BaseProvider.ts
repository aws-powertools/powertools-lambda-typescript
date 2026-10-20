import {
  addUserAgentMiddleware,
  isNullOrUndefined,
  isRecord,
  isSdkClient,
  isString,
} from '@aws-lambda-powertools/commons';
import { CacheKeyKind, type CacheKeyKindOptions } from '../constants.js';
import {
  GetParameterError,
  ParameterNotFoundError,
  TransformParameterError,
} from '../errors.js';
import type {
  BaseProviderConstructorOptions,
  BaseProviderInterface,
  GetMultipleOptionsInterface,
  GetOptionsInterface,
} from '../types/BaseProvider.js';
import { ExpirableValue } from './ExpirableValue.js';
import { GetMultipleOptions } from './GetMultipleOptions.js';
import { GetOptions } from './GetOptions.js';
import { transformValue } from './transformValue.js';

/**
 * Request options that do not affect the value stored in the cache.
 *
 * `throwOnTransformError` is deliberately absent: when `false`, entries that fail to
 * transform are cached as `undefined`, so lenient and strict calls must not share an entry.
 */
const CACHE_KEY_IGNORED_OPTIONS: ReadonlySet<string> = new Set<
  keyof GetMultipleOptionsInterface | 'throwOnError'
>(['maxAge', 'forceFetch', 'throwOnMissing', 'throwOnError']);

/** `JSON.stringify` replacer that emits object keys in sorted order so equivalent options serialise identically. */
const sortObjectKeys = (_key: string, value: unknown): unknown => {
  if (!isRecord(value)) return value;

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = value[key];
  }

  return sorted;
};

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
 * Cached values are keyed by the method used, the parameter name, and every request option that can change the
 * value returned by the store (for example `transform`, `decrypt`, `recursive`, or `sdkOptions`). Calls that differ
 * in any of these are cached separately, so a value is only ever served to a request that would have produced it.
 *
 * This means that we need to make multiple calls to the underlying parameter store if we need the same parameter
 * in different transforms or with different options. Since a given parameter is usually always requested the same
 * way, this should be an acceptable tradeoff.
 */
abstract class BaseProvider implements BaseProviderInterface {
  protected client: unknown;
  protected store: Map<string, ExpirableValue>;

  public constructor({
    awsSdkV3Client,
    clientConfig,
    awsSdkV3ClientPrototype,
  }: BaseProviderConstructorOptions) {
    this.store = new Map();
    /* v8 ignore else -- @preserve */
    if (awsSdkV3Client) {
      if (!isSdkClient(awsSdkV3Client) && awsSdkV3ClientPrototype) {
        console.warn(
          'awsSdkV3Client is not an AWS SDK v3 client, using default client'
        );
        this.client = new awsSdkV3ClientPrototype(clientConfig ?? {});
      } else {
        this.client = awsSdkV3Client;
      }
    } else if (awsSdkV3ClientPrototype) {
      this.client = new awsSdkV3ClientPrototype(clientConfig ?? {});
    }
    if (isSdkClient(this.client)) {
      addUserAgentMiddleware(this.client, 'parameters');
    }
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
   * Build the cache key for a request.
   *
   * The key covers the method, the name, and every option that can affect the cached value,
   * so requests that would receive different values never share an entry. Object keys are
   * sorted so option order does not matter.
   *
   * @param kind - Whether the request is for a single value or multiple values
   * @param name - Parameter name or path
   * @param options - Options passed to the request
   */
  protected buildCacheKey(
    kind: CacheKeyKindOptions,
    name: string,
    options?: object
  ): string {
    const significant: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(options ?? {})) {
      if (!CACHE_KEY_IGNORED_OPTIONS.has(key)) significant[key] = value;
    }

    return JSON.stringify([kind, name, significant], sortObjectKeys);
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
  ): Promise<unknown> {
    const configs = new GetOptions(options);
    const key = this.buildCacheKey(CacheKeyKind.GET, name, options);

    if (
      !configs.forceFetch &&
      configs.maxAge > 0 &&
      !this.hasKeyExpiredInCache(key)
    ) {
      // biome-ignore lint/style/noNonNullAssertion: If the code enters this block, then the key must exist & not have been expired
      return this.store.get(key)!.value;
    }

    try {
      let value = await this._get(name, options);

      if (isNullOrUndefined(value)) {
        if (configs.throwOnMissing) {
          throw new ParameterNotFoundError(
            `Parameter ${name} not found in the store`
          );
        }

        return undefined;
      }

      if (
        configs.transform &&
        (isString(value) || value instanceof Uint8Array)
      ) {
        value = transformValue(value, configs.transform, true, name);
      }

      this.addToCache(key, value, configs.maxAge);

      return value;
    } catch (error) {
      if (error instanceof TransformParameterError) throw error;
      if (error instanceof ParameterNotFoundError) throw error;
      throw new GetParameterError((error as Error).message, {
        cause: error,
      });
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
    const configs = new GetMultipleOptions(options);
    const key = this.buildCacheKey(CacheKeyKind.GET_MULTIPLE, path, options);

    if (
      !configs.forceFetch &&
      configs.maxAge > 0 &&
      !this.hasKeyExpiredInCache(key)
    ) {
      // biome-ignore lint/style/noNonNullAssertion: If the code enters in this block, then the key must exist & not have been expired
      return this.store.get(key)!.value as Record<string, unknown>;
    }

    let values: Record<string, unknown> | undefined;
    try {
      values = await this._getMultiple(path, options);
      if (!isRecord(values)) {
        throw new GetParameterError(
          `Expected result to be a Record<string, unknown> but got ${typeof values}`
        );
      }
    } catch (error) {
      throw new GetParameterError((error as Error).message, {
        cause: error,
      });
    }

    if (configs.transform) {
      for (const [entryKey, entryValue] of Object.entries(values)) {
        if (!(isString(entryValue) || entryValue instanceof Uint8Array))
          continue;
        try {
          values[entryKey] = transformValue(
            entryValue,
            configs.transform,
            configs.throwOnTransformError,
            entryKey
          );
        } catch (error) {
          /* v8 ignore else -- @preserve */
          if (configs.throwOnTransformError) {
            if (error instanceof TransformParameterError) {
              throw error;
            }

            // Otherwise wrap—but preserve the original stack
            const wrapped = new TransformParameterError(
              configs.transform,
              (error as Error).message
            );
            wrapped.stack = (error as Error).stack;
            throw wrapped;
          }
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
  ): Promise<Record<string, unknown> | undefined>;
}

export { BaseProvider };
