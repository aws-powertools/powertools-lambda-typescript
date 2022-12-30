import { fromBase64 } from '@aws-sdk/util-base64';
import { GetOptions } from './GetOptions';
import { GetMultipleOptions } from './GetMultipleOptions';
import { ExpirableValue } from './ExpirableValue';
import { TRANSFORM_METHOD_BINARY, TRANSFORM_METHOD_JSON } from './constants';
import { GetParameterError, TransformParameterError } from './Exceptions';
import type { BaseProviderInterface, GetMultipleOptionsInterface, GetOptionsInterface, TransformOptions } from './types';

// These providers are dinamycally intialized on first use of the helper functions
const DEFAULT_PROVIDERS: Record<string, BaseProvider> = {};

abstract class BaseProvider implements BaseProviderInterface {
  protected store: Map<string, ExpirableValue>;

  public constructor() {
    this.store = new Map();
  }

  public addToCache(key: string, value: string | Uint8Array | Record<string, unknown>, maxAge: number): void {
    if (maxAge <= 0) return;

    this.store.set(key, new ExpirableValue(value, maxAge));
  }

  public clearCache(): void {
    this.store.clear();
  }

  /**
   * Retrieve a parameter value or return the cached value
   * 
   * If there are multiple calls to the same parameter but in a different transform, they will be stored multiple times.
   * This allows us to optimize by transforming the data only once per retrieval, thus there is no need to transform cached values multiple times.
   * 
   * However, this means that we need to make multiple calls to the underlying parameter store if we need to return it in different transforms.
   * 
   * Since the number of supported transform is small and the probability that a given parameter will always be used in a specific transform,
   * this should be an acceptable tradeoff.
   * 
   * @param {string} name - Parameter name
   * @param {GetOptionsInterface} options - Options to configure maximum age, trasformation, AWS SDK options, or force fetch
   */
  public async get(name: string, options?: GetOptionsInterface): Promise<undefined | string | Uint8Array | Record<string, unknown>> {
    const configs = new GetOptions(options);
    const key = [ name, configs.transform ].toString();

    if (!configs.forceFetch && !this.hasKeyExpiredInCache(key)) {
      // If the code enters in this block, then the key must exist & not have been expired
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.store.get(key)!.value;
    }

    let value;
    try {
      value = await this._get(name, options);
    } catch (error) {
      throw new GetParameterError((error as Error).message);
    }

    if (value && configs.transform) {
      value = transformValue(value, configs.transform, true);
    }

    if (value) {
      this.addToCache(key, value, configs.maxAge);
    }

    // TODO: revisit return type once providers are implemented, it might be missing binary when not transformed
    return value;
  }

  public async getMultiple(path: string, options?: GetMultipleOptionsInterface): Promise<undefined | Record<string, unknown>> {
    const configs = new GetMultipleOptions(options || {});
    const key = [ path, configs.transform ].toString();

    if (!configs.forceFetch && !this.hasKeyExpiredInCache(key)) {
      // If the code enters in this block, then the key must exist & not have been expired
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.store.get(key)!.value as Record<string, unknown>;
    }

    let values = {};
    try {
      values = await this._getMultiple(path, options);
    } catch (error) {
      throw new GetParameterError((error as Error).message);
    }

    if (Object.keys(values) && configs.transform) {
      values = transformValues(values, configs.transform, configs.throwOnTransformError);
    }

    if (Array.from(Object.keys(values)).length !== 0) {
      this.addToCache(key, values, configs.maxAge);
    }

    // TODO: revisit return type once providers are implemented, it might be missing something
    return values;
  }

  /**
   * Retrieve parameter value from the underlying parameter store
   * 
   * @param {string} name - Parameter name
   * @param {unknown} options - Options to pass to the underlying implemented method
   */
  protected abstract _get(name: string, options?: unknown): Promise<string | Uint8Array | undefined>;

  /**
   * Retrieve multiple parameter values from the underlying parameter store
   * 
   * @param {string} path - Parameter name
   * @param {unknown} options - Options to pass to the underlying implementated method
   */
  protected abstract _getMultiple(path: string, options?: unknown): Promise<Record<string, string | undefined>>;

  /**
   * Check whether a key has expired in the cache or not
   * 
   * It returns true if the key is expired or not present in the cache.
   * 
   * @param {string} key - Stringified representation of the key to retrieve
   */
  private hasKeyExpiredInCache(key: string): boolean {
    const value = this.store.get(key);
    if (value) return value.isExpired();

    return true;
  }

}

const transformValue = (value: string | Uint8Array | undefined, transform: TransformOptions, throwOnTransformError: boolean, key: string = ''): string | Record<string, unknown> | undefined => {
  try {
    const normalizedTransform = transform.toLowerCase();
    if (
      (normalizedTransform === TRANSFORM_METHOD_JSON ||
        (normalizedTransform === 'auto' && key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_JSON}`))) &&
      typeof value === 'string'
    ) {
      return JSON.parse(value) as Record<string, unknown>;
    } else if (
      (normalizedTransform === TRANSFORM_METHOD_BINARY ||
        (normalizedTransform === 'auto' && key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_BINARY}`)))
    ) {
      if (typeof value === 'string') {
        return new TextDecoder('utf-8').decode(fromBase64(value));
      } else {
        return new TextDecoder('utf-8').decode(value);
      }
    } else {
      return value as string;
    }
  } catch (error) {
    if (throwOnTransformError)
      throw new TransformParameterError(transform, (error as Error).message);

    return;
  }
};

const transformValues = (value: Record<string, string | undefined>, transform: TransformOptions, throwOnTransformError: boolean): Record<string, string | Record<string, unknown> | undefined> => {
  const transformedValues: Record<string, string | Record<string, unknown> | undefined> = {};
  for (const [ entryKey, entryValue ] of Object.entries(value)) {
    try {
      transformedValues[entryKey] = transformValue(entryValue, transform, throwOnTransformError, entryKey);
    } catch (error) {
      if (throwOnTransformError)
        throw new TransformParameterError(transform, (error as Error).message);
    }
  }

  return transformedValues;
};

export {
  BaseProvider,
  ExpirableValue,
  transformValue,
  DEFAULT_PROVIDERS,
};