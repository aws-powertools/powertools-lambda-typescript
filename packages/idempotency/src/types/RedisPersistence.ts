import type { JSONValue } from '@aws-lambda-powertools/commons/types';

/**
 * Protocol defining the interface for a Redis client.
 * This ensures standardization among different Redis client implementations.
 */
interface RedisClientProtocol {

  /**
   * Indicates whether the connection to the Redis server is currently open and ready for commands.
   * This can be used to check the connection status before sending commands.
   */
  isOpen: boolean;
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
   */
  set(
    name: string,
    value: string,
    options?: {
      EX?: number; // Expiration time in seconds
      PX?: number; // Expiration time in milliseconds
      NX?: boolean; // Only set the key if it does not already exist
    }
  ): Promise<boolean | null>;

  /**
   * Deletes one or more keys.
   * @param keys The key(s) to delete
   */
  del(keys: string): Promise<number>;
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
   * A Redis client that implements the RedisClientProtocol interface.
   * If provided, all other connection configuration options will be ignored.
   */
  client: RedisClientProtocol;

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

  /**
   * Function used to serialize JSON data (default: JSON.stringify)
   */
  jsonSerializer?: (value: JSONValue) => string;

  /**
   * Function used to deserialize JSON data (default: JSON.parse)
   */
  jsonDeserializer?: (text: string) => JSONValue;
}

export type {
  RedisClientProtocol,
  RedisConnectionConfig,
  RedisPersistenceOptions,
};
