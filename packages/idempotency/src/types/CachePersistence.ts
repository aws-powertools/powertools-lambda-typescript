import type { CachePersistenceLayer } from './../persistence/CachePersistenceLayer.js';
import type { BasePersistenceAttributes } from './BasePersistenceLayer.js';

type CacheValue = string | Uint8Array<ArrayBufferLike>;

/**
 * Options for the `SET` command in the shape read by `@redis/client`.
 *
 * @see {@link https://valkey.io/commands/set/ | Valkey SET command}
 */
interface RedisSetOptions {
  /**
   * The expiry time in seconds, `EX` in the `SET` command.
   */
  EX?: number;
  /**
   * Whether to set the key only if it does not already exist, `NX` in the `SET` command.
   */
  NX?: boolean;
}

/**
 * Options for the `SET` command in the shape read by `@valkey/valkey-glide`.
 *
 * The property types mirror the ones declared by Valkey Glide, so that its clients remain
 * assignable to {@link CacheClient | `CacheClient`}. Glide declares `expiry.type` as its
 * `TimeUnit` enum, whose values are the strings sent to the server, for example `'EX'`.
 *
 * @see {@link https://valkey.io/commands/set/ | Valkey SET command}
 */
interface GlideSetOptions {
  /**
   * The condition for setting the key, `onlyIfDoesNotExist` is `NX` in the `SET` command.
   */
  conditionalSet?: 'onlyIfExists' | 'onlyIfDoesNotExist' | 'onlyIfEqual';
  /**
   * The expiry of the key, `{ type: 'EX', count: seconds }` is `EX` in the `SET` command.
   */
  expiry?: 'keepExisting' | { type: string; count: number };
}

/**
 * Options passed to {@link CacheClient.set | `CacheClient.set()`}.
 *
 * The persistence layer passes each option in the shape of both supported clients, since
 * `@redis/client` and `@valkey/valkey-glide` each read their own properties and ignore the others.
 * Typing both shapes means a client that does not accept one of them fails to compile.
 */
type CacheClientSetOptions = RedisSetOptions & GlideSetOptions;

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
   */
  set(
    name: CacheValue,
    value: unknown,
    options?: CacheClientSetOptions
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

export type {
  CacheClient,
  CacheClientSetOptions,
  CachePersistenceOptions,
  GlideSetOptions,
  RedisSetOptions,
};
