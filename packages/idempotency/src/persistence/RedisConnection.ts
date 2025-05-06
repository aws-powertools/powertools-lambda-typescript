import { createClient, createCluster } from '@redis/client';
import type { RedisClientType, RedisClusterType } from '@redis/client';
import type { RedisConnectionConfig } from '../types/RedisPersistence.js';

/**
 * A class for creating and managing Redis client connections.
 *
 * This class handles both standalone and cluster connection modes to Redis,
 * providing an abstraction layer over the Redis client creation process.
 */
class RedisConnection {
  readonly #mode: 'standalone' | 'cluster';
  readonly #host: string;
  readonly #port: number;
  readonly #username: string;
  readonly #password: string;
  readonly #url: string;
  readonly #dbIndex: number;
  readonly #ssl: boolean;

  public constructor(options: RedisConnectionConfig) {
    this.#mode = options.mode ?? 'standalone';
    this.#host = options.host ?? '';
    this.#port = options.port ?? 6379;
    this.#username = options.username ?? '';
    this.#password = options.password ?? '';
    this.#url = options.url ?? '';
    this.#dbIndex = options.dbIndex ?? 0;
    this.#ssl = options.ssl ?? true;
  }

  /**
   * Returns a Redis client based on the connection mode.
   * If the mode is 'cluster', it creates a Redis cluster client.
   * If the mode is 'standalone', it creates a standalone Redis client.
   */
  public getClient(): RedisClientType | RedisClusterType {
    return this.#mode === 'cluster'
      ? this.#createClusterClient()
      : this.#createStandaloneClient();
  }

  /**
   * Creates a Redis cluster client.
   * The client will connect to the Redis cluster using the provided URL.
   */
  #createClusterClient(): RedisClusterType {
    return createCluster({
      rootNodes: [{ url: this.#url }],
    });
  }

  /**
   * Creates a standalone Redis client.
   * The client will connect to the Redis server using the provided host, port, username, password, and database index.
   * If a URL is provided, it will be used to create the client instead of the other parameters.
   */
  #createStandaloneClient(): RedisClientType {
    if (this.#url) {
      return createClient({ url: this.#url });
    }

    return createClient({
      username: this.#username,
      password: this.#password,
      socket: {
        host: this.#host,
        port: this.#port,
        ...(this.#ssl ? { tls: true } : {}),
      },
      database: this.#dbIndex,
    });
  }
}

export default RedisConnection;
