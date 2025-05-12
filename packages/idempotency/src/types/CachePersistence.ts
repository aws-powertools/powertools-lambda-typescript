import type { CachePersistenceLayer } from './../persistence/CachePersistenceLayer.js';
import type { BasePersistenceAttributes } from './BasePersistenceLayer.js';

type CacheValue = string | Uint8Array<ArrayBufferLike>;

/**
 * Interface for clients compatible with Valkey and Redis-OSS operations.
 *
 * This interface defines the minimum set of operations that must be implemented
 * by a client to be used with the cache persistence layer.
 *
 * It supports basic key-value operations like get, set, and delete.
 */
interface CacheClient {
  /**
   * Retrieves the value associated with the given key.
   *
   * @param name - The key to get the value for
   */
  get(name: string): Promise<CacheValue | null>;

  /**
   * Sets the value for the specified key with optional parameters.
   *
   * @param name - The key to set
   * @param value - The value to set
   * @param options - Optional parameters for setting the value
   * @param options.EX - Set the specified expire time, in seconds (a positive integer)
   * @param options.NX - Only set the key if it does not already exist
   */
  set(
    name: CacheValue,
    value: unknown,
    options?: {
      EX?: number;
      NX?: boolean;
    }
  ): Promise<CacheValue | null>;

  /**
   * Deletes the specified keys from the cache.
   *
   * @param keys - The keys to delete
   */
  del(keys: string[]): Promise<number>;
}

/**
 * Options for the {@link CachePersistenceLayer | `CachePersistenceLayer`} class constructor.
 *
 * @see {@link BasePersistenceAttributes} for full list of properties.
 *
 * @interface
 * @property client - The client must be properly initialized and connected
 */
interface CachePersistenceOptions extends BasePersistenceAttributes {
  client: CacheClient;
}

export type { CacheClient, CachePersistenceOptions };
