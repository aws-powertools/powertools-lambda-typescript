import {
  addUserAgentMiddleware,
  isNullOrUndefined,
  isRecord,
  isSdkClient,
  isString,
} from '@aws-lambda-powertools/commons';
import { GetOptions } from './GetOptions.js';
import { GetMultipleOptions } from './GetMultipleOptions.js';
import { ExpirableValue } from './ExpirableValue.js';
import { GetParameterError, TransformParameterError } from '../errors.js';
import { EnvironmentVariablesService } from '../config/EnvironmentVariablesService.js';
import { transformValue } from './transformValue.js';
import type {
  BaseProviderInterface,
  GetMultipleOptionsInterface,
  GetOptionsInterface,
} from '../types/BaseProvider.js';

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
  protected client: unknown;
  protected store: Map<string, ExpirableValue>;

  public constructor({
    awsSdkV3Client,
    clientConfig,
    proto,
  }: {
    awsSdkV3Client?: unknown;
    clientConfig?: unknown;
    proto: new (config?: unknown) => unknown;
  }) {
    this.store = new Map();
    this.envVarsService = new EnvironmentVariablesService();
    if (awsSdkV3Client) {
      if (!isSdkClient(awsSdkV3Client)) {
        console.warn(
          'awsSdkV3Client is not an AWS SDK v3 client, using default client'
        );
        this.client = new proto(clientConfig ?? {});
      } else {
        this.client = awsSdkV3Client;
      }
    } else {
      this.client = new proto(clientConfig ?? {});
    }
    addUserAgentMiddleware(this.client, 'parameters');
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

export { BaseProvider };
