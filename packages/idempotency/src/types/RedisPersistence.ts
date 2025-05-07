import type { JSONValue } from '@aws-lambda-powertools/commons/types';

/**
 * Interface for clients compatible with Redis operations.
 *
 * This interface defines the minimum set of Redis operations that must be implemented
 * by a client to be used with the Redis persistence layer. It supports basic key-value
 * operations like get, set, and delete.
 */
interface RedisCompatibleClient {
  /**
   * Retrieves the value associated with the given key.
   * @param name The key to get the value for
   */
  get(name: string): Promise<string | null>;

  /**
   * Sets the value for the specified key with optional parameters.
   * @param name The key to set
   * @param value The value to set
   * @param options Optional parameters for setting the value
   * @param options.EX Set the specified expire time, in seconds (a positive integer)
   * @param options.NX Only set the key if it does not already exist
   */
  set(
    name: string,
    value: JSONValue,
    options?: {
      EX?: number;
      NX?: boolean;
    }
  ): Promise<string | null>;

  /**
   * Deletes the specified keys from Redis.
   * @param keys The keys to delete
   */
  del(keys: string[]): Promise<number>;
}

/**
 * Redis client connection configuration parameters
 */
interface RedisConnectionConfig {
  /**
   * Redis host
   */
  host?: string;

  /**
   * Redis port (default: 6379)
   */
  port?: number;

  /**
   * Redis username
   */
  username?: string;

  /**
   * Redis password
   */
  password?: string;

  /**
   * Redis connection string URL, overrides host/port if provided
   */
  url?: string;

  /**
   * Redis database index (default: 0)
   */
  dbIndex?: number;

  /**
   * Redis client mode (default: 'standalone')
   */
  mode?: 'standalone' | 'cluster';

  /**
   * Whether to use SSL for Redis connection (default: true)
   */
  ssl?: boolean;
}

/**
 * Options for configuring the Redis persistence layer
 */
interface RedisPersistenceOptions extends RedisConnectionConfig {
  /**
   * A Redis client that implements the RedisCompatibleClient interface.
   * If provided, all other connection configuration options will be ignored.
   */
  client?: RedisCompatibleClient;

  /**
   * Redis JSON attribute name for expiry timestamp (default: 'expiration')
   */
  expiryAttr?: string;

  /**
   * Redis JSON attribute name for in-progress expiry timestamp (default: 'in_progress_expiration')
   */
  inProgressExpiryAttr?: string;

  /**
   * Redis JSON attribute name for status (default: 'status')
   */
  statusAttr?: string;

  /**
   * Redis JSON attribute name for response data (default: 'data')
   */
  dataAttr?: string;

  /**
   * Redis JSON attribute name for hashed representation of the parts of the event used for validation
   * (default: 'validation')
   */
  validationKeyAttr?: string;
}

export type {
  RedisCompatibleClient,
  RedisConnectionConfig,
  RedisPersistenceOptions,
};
