import { fromBase64 } from '@aws-sdk/util-base64-node';
import { GetParameterError, TransformParameterError } from 'Exceptions';
import type { BaseProviderInterface, ExpirableValueInterface, GetMultipleOptionsInterface, GetOptionsInterface, Key, TransformOptions } from './types';

const DEFAULT_MAX_AGE_SECS = 5;
// These providers will be dynamically initialized on first use of the helper functions
const DEFAULT_PROVIDERS = new Map();
const TRANSFORM_METHOD_JSON = 'json';
const TRANSFORM_METHOD_BINARY = 'binary';

class GetOptions implements GetOptionsInterface {
  public forceFetch: boolean = false;
  public maxAge: number = DEFAULT_MAX_AGE_SECS;
  public sdkOptions?: unknown;
  public transform?: TransformOptions;

  public constructor(options: GetOptionsInterface = {}) {
    Object.assign(this, options);
  }
}

class GetMultipleOptions implements GetMultipleOptionsInterface {
  public forceFetch: boolean = false;
  public maxAge: number = DEFAULT_MAX_AGE_SECS;
  public sdkOptions?: unknown;
  public throwOnTransformError?: boolean = false;
  public transform?: TransformOptions;

  public constructor(options: GetMultipleOptionsInterface) {
    Object.assign(this, options);
  }
}

class ExpirableValue implements ExpirableValueInterface {
  public ttl: number;
  public value: string | Record<string, unknown>;

  public constructor(value: string | Record<string, unknown>, maxAge: number) {
    this.value = value;
    const timeNow = new Date();
    this.ttl = timeNow.setSeconds(timeNow.getSeconds() + maxAge);
  }

  public isExpired(): boolean {
    return this.ttl < Date.now();
  }
}

abstract class BaseProvider implements BaseProviderInterface {
  public store: Map<Key, ExpirableValue> = new Map;

  private constructor () {
    this.store = new Map();
  }

  public addToCache(key: Key, value: string | Record<string, unknown>, maxAge: number): void {
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
  public async get(name: string, options?: GetOptionsInterface): Promise<undefined | string | Record<string, unknown>> {
    const configs = new GetOptions(options);
    const key = { [name]: configs.transform };

    if (!configs.forceFetch && this.hasNotExpiredInCache(key)) {
      return this.store.get(key)?.value;
    }

    let value;
    try {
      value = await this._get(name, options?.sdkOptions);
    } catch (error) {
      throw new GetParameterError((error as Error).message);
    }

    if (value && configs.transform) {
      value = transformValue(value, configs.transform);
    }

    if (value) {
      this.addToCache(key, value, configs.maxAge);
    }

    // TODO: revisit return type once providers are implemented, it might be missing binary when not transformed
    return value;
  }

  public async getMultiple(path: string, options?: GetMultipleOptionsInterface): Promise<undefined | Record<string, unknown>> {
    const configs = new GetMultipleOptions(options || {});
    const key = { [path]: configs.transform };

    if (!configs.forceFetch && this.hasNotExpiredInCache(key)) {
      return this.store.get(key)?.value as Record<string, unknown>; // In this case we know that if it exists, this key corresponds to a Record
    }

    let values: Record<string, unknown> = {};
    try {
      values = await this._getMultiple(path, options?.sdkOptions);
    } catch (error) {
      throw new GetParameterError((error as Error).message);
    }

    if (configs.transform) {
      values = transformValues(values, configs.transform);
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
   * @param {unknown} sdkOptions - Options to pass to the underlying AWS SDK
   */
  protected abstract _get(name: string, sdkOptions?: unknown): Promise<string | undefined>;

  protected abstract _getMultiple(path: string, sdkOptions?: unknown): Promise<Record<string, string|undefined>>;

  /**
   * Check whether a key has not expired in the cache
   * 
   * It returns false if the key is expired or not present in the cache.
   * 
   * @param {Key} key - Key to retrieve
   */
  private hasNotExpiredInCache(key: Key): boolean {
    const value = this.store.get(key);
    if (value) value.isExpired();

    return false;
  }

}

const transformValue = (value: string, transform: TransformOptions, throwOnTransformError: boolean = true, key: string = ''): string | Record<string, unknown> | undefined => {
  try {
    const normalizedTransform = transform.toLowerCase();
    if (
      normalizedTransform === TRANSFORM_METHOD_JSON ||
      (normalizedTransform === 'auto' && key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_JSON}`))
    ) {
      return JSON.parse(value) as Record<string, unknown>;
    } else if (
      normalizedTransform === TRANSFORM_METHOD_BINARY ||
      (normalizedTransform === 'auto' && key.toLowerCase().endsWith(`.${TRANSFORM_METHOD_BINARY}`))
    ) {
      return new TextDecoder('utf-8').decode(fromBase64(value));
    } else {
      throw Error(`Invalid transform type ${normalizedTransform}.`);
    }
  } catch (error) {
    if (throwOnTransformError)
      throw new TransformParameterError(transform, (error as Error).message);
    
    return;
  }
};

const transformValues = (value: string | Uint8Array | Record<string, unknown>, transform: TransformOptions, throwOnTransformError: boolean = true): Record<string, unknown> => {
  const transformedValues: Record<string, unknown> = {};
  for (const entry in Object.entries(value)) {
    const [ entryKey, entryValue ] = entry;
    try {
      transformedValues[entryKey] = transformValue(entryValue, transform, true, entryKey);
    } catch (error) {
      if (throwOnTransformError)
        throw new TransformParameterError(transform, (error as Error).message);
      transformedValues[entryKey] = undefined;
    }
  }

  return transformedValues;
};

const clearCaches = (): void => DEFAULT_PROVIDERS.clear();

export {
  clearCaches,
  BaseProvider,
  transformValue,
  DEFAULT_PROVIDERS
};