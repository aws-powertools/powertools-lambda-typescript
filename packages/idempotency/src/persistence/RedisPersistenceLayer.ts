import type { JSONObject } from '@aws-lambda-powertools/commons/types';
import type { RedisClientType, RedisClusterType } from '@redis/client';
import { IdempotencyRecordStatus } from '../constants.js';
import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
  IdempotencyPersistenceConnectionError,
  IdempotencyPersistenceConsistencyError,
  IdempotencyUnknownError,
} from '../errors.js';
import type { IdempotencyRecordStatusValue } from '../types/IdempotencyRecord.js';
import type {
  RedisClientProtocol,
  RedisPersistenceOptions,
} from '../types/RedisPersistence.js';
import { BasePersistenceLayer } from './BasePersistenceLayer.js';
import { IdempotencyRecord } from './IdempotencyRecord.js';
import RedisConnection from './RedisConnection.js';

/**
 * Redis persistence layer for idempotency records.
 *
 * This class uses Redis to write and read idempotency records. It supports both the default Redis client
 * from @redis/client package as well as custom Redis clients.
 *
 * There are various options to configure the persistence layer, such as attribute names for storing
 * status, expiry, data, and validation keys in Redis.
 *
 * With default configuration, you don't need to create the Redis client beforehand, the persistence layer
 * will create it for you using the provided options. You can also bring your own Redis client by passing
 * it through the `client` option.
 *
 * See the {@link https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/ Idempotency documentation}
 * for more details on the Redis configuration and usage patterns.
 *
 * @example
 * ```ts
 * import { RedisPersistenceLayer } from '@aws-lambda-powertools/idempotency/redis';
 *
 * const persistence = await new RedisPersistenceLayer({ url: 'redis://localhost:6379' }).init();
 * ```
 *
 * @example
 * ```ts
 * // Using your own Redis client
 * import { createClient } from '@redis/client';
 * import { RedisPersistenceLayer } from '@aws-lambda-powertools/idempotency/redis';
 *
 * const redisClient = createClient({ url: 'redis://localhost:6379' });
 * await redisClient.connect();
 *
 * const persistence = new RedisPersistenceLayer({
 *   client: redisClient,
 * });
 * ```
 *
 * @see https://github.com/redis/node-redis/tree/master/packages/client
 * @category Persistence Layer
 */
class RedisPersistenceLayer extends BasePersistenceLayer {
  readonly #client: RedisClientProtocol | RedisClientType | RedisClusterType;
  readonly #dataAttr: string;
  readonly #expiryAttr: string;
  readonly #inProgressExpiryAttr: string;
  readonly #statusAttr: string;
  readonly #validationKeyAttr: string;
  readonly #orphanLockTimeout: number;

  public constructor(options: RedisPersistenceOptions) {
    super();

    this.#statusAttr = options.statusAttr ?? 'status';
    this.#expiryAttr = options.expiryAttr ?? 'expiration';
    this.#inProgressExpiryAttr =
      options.inProgressExpiryAttr ?? 'in_progress_expiration';
    this.#dataAttr = options.dataAttr ?? 'data';
    this.#validationKeyAttr = options.validationKeyAttr ?? 'validation';
    this.#orphanLockTimeout = Math.min(10, this.expiresAfterSeconds);
    if (options.client) {
      this.#client = options.client;
    } else {
      this.#client = new RedisConnection(options).getClient();
    }
  }

  /**
   * Initializes the Redis connection if it's the default Redis client and not already open.
   *
   * This method attempts to connect to Redis if necessary. If using a custom Redis client,
   * it assumes the client is already connected.
   *
   * @throws {IdempotencyPersistenceConnectionError} When the connection to Redis fails
   */
  public async init() {
    if (
      this.#isDefaultRedisClient(this.#client) &&
      this.#client.isOpen === false
    ) {
      try {
        await this.#client.connect();
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw new IdempotencyPersistenceConnectionError(
          'Could not connect to Redis',
          error as Error
        );
      }
    }
    return this;
  }

  /**
   * Deletes the idempotency record associated with a given record from Redis.
   * This function is designed to be called after a Lambda handler invocation has completed processing.
   * It ensures that the idempotency key associated with the record is removed from Redis to
   * prevent future conflicts and to maintain the idempotency integrity.
   *
   * Note: it is essential that the idempotency key is not empty, as that would indicate the Lambda
   * handler has not been invoked or the key was not properly set.
   *
   * @param record
   */
  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
    console.debug(
      `Deleting record for idempotency key: ${record.idempotencyKey}`
    );
    await this.#client.del([record.idempotencyKey]);
  }

  protected async _putRecord(record: IdempotencyRecord): Promise<void> {
    if (record.getStatus() === IdempotencyRecordStatus.INPROGRESS) {
      await this.#putInProgressRecord(record);
    } else {
      throw new IdempotencyUnknownError(
        'Only INPROGRESS records can be inserted with _putRecord'
      );
    }
  }

  protected async _getRecord(
    idempotencyKey: string
  ): Promise<IdempotencyRecord> {
    const response = await this.#client.get(idempotencyKey);

    if (response === null) {
      throw new IdempotencyItemNotFoundError(
        'Item does not exist in persistence store'
      );
    }
    let item: JSONObject;
    try {
      item = JSON.parse(response);
    } catch (error) {
      throw new IdempotencyPersistenceConsistencyError(
        'Idempotency persistency consistency error, needs to be removed',
        error as Error
      );
    }
    return new IdempotencyRecord({
      idempotencyKey: idempotencyKey,
      status: item[this.#statusAttr] as IdempotencyRecordStatusValue,
      expiryTimestamp: item[this.#expiryAttr] as number | undefined,
      inProgressExpiryTimestamp: item[this.#inProgressExpiryAttr] as
        | number
        | undefined,
      responseData: item[this.#dataAttr],
      payloadHash: item[this.#validationKeyAttr] as string | undefined,
    });
  }

  protected async _updateRecord(record: IdempotencyRecord): Promise<void> {
    const item: Record<string, unknown> = {
      [this.#statusAttr]: record.getStatus(),
      [this.#expiryAttr]: record.expiryTimestamp,
      [this.#dataAttr]: record.responseData,
    };

    const encodedItem = JSON.stringify(item);
    const ttl = this.#getExpirySeconds(record.expiryTimestamp);
    // Need to set ttl again, if we don't set `EX` here the record will not have a ttl
    await this.#client.set(record.idempotencyKey, encodedItem, {
      EX: ttl,
    });
  }

  /**
   * Determines if the provided Redis client is a default Redis client.
   *
   * This method checks if the provided client is an instance of the default Redis client
   * by verifying the presence of the 'isOpen' property, which is specific to
   * RedisClientType or RedisClusterType from the @redis/client package.
   *
   * @param client - The Redis client to check
   */
  #isDefaultRedisClient(
    client: RedisClientProtocol | RedisClientType | RedisClusterType
  ): client is RedisClientType | RedisClusterType {
    return 'isOpen' in client;
  }

  /**
   * Put a record in the persistence store with a status of "INPROGRESS".
   * The method guards against concurrent execution by using Redis' conditional write operations.
   */
  async #putInProgressRecord(record: IdempotencyRecord): Promise<void> {
    const item: Record<string, unknown> = {
      [this.#statusAttr]: record.getStatus(),
      [this.#expiryAttr]: record.expiryTimestamp,
    };

    if (record.inProgressExpiryTimestamp !== undefined) {
      item[this.#inProgressExpiryAttr] = record.inProgressExpiryTimestamp;
    }

    if (this.isPayloadValidationEnabled() && record.payloadHash !== undefined) {
      item[this.#validationKeyAttr] = record.payloadHash;
    }

    const encodedItem = JSON.stringify(item);
    const ttl = this.#getExpirySeconds(record.expiryTimestamp);
    const now = Date.now();

    try {
      /**
       * |     LOCKED     |         RETRY if status = "INPROGRESS"                |     RETRY
       * |----------------|-------------------------------------------------------|-------------> .... (time)
       * |             Lambda                                              Idempotency Record
       * |             Timeout                                                 Timeout
       * |       (in_progress_expiry)                                          (expiry)
       *
       * Conditions to successfully save a record:
       * * The idempotency key does not exist:
       *   - first time that this invocation key is used
       *   - previous invocation with the same key was deleted due to TTL
       *   - SET see https://redis.io/commands/set/
       */

      console.debug(
        `Putting record for idempotency key: ${record.idempotencyKey}`
      );
      const response = await this.#client.set(
        record.idempotencyKey,
        encodedItem,
        {
          EX: ttl,
          NX: true,
        }
      );

      /**
       * If response is not `null`, the redis SET operation was successful and the idempotency key was not
       * previously set. This indicates that we can safely proceed to the handler execution phase.
       * Most invocations should successfully proceed past this point.
       */
      if (response !== null) {
        return;
      }

      /**
       * If response is `null`, it indicates an existing record in Redis for the given idempotency key.
       * This could be due to:
       *   - An active idempotency record from a previous invocation that has not yet expired.
       *   - An orphan record where a previous invocation has timed out.
       *   - An expired idempotency record that has not been deleted by Redis.
       *
       * In any case, we proceed to retrieve the record for further inspection.
       */
      const existingRecord = await this._getRecord(record.idempotencyKey);

      /** If the status of the idempotency record is `COMPLETED` and the record has not expired
       * (i.e., the expiry timestamp is greater than the current timestamp), then a valid completed
       * record exists. We raise an error to prevent duplicate processing of a request that has already
       * been completed successfully.
       */
      if (
        existingRecord.getStatus() === IdempotencyRecordStatus.COMPLETED &&
        !existingRecord.isExpired()
      ) {
        throw new IdempotencyItemAlreadyExistsError(
          `Failed to put record for already existing idempotency key: ${record.idempotencyKey}`,
          existingRecord
        );
      }

      /** If the idempotency record has a status of 'INPROGRESS' and has a valid `inProgressExpiryTimestamp`
       * (meaning the timestamp is greater than the current timestamp in milliseconds), then we have encountered
       * a valid in-progress record. This indicates that another process is currently handling the request, and
       * to maintain idempotency, we raise an error to prevent concurrent processing of the same request.
       */
      if (
        existingRecord.getStatus() === IdempotencyRecordStatus.INPROGRESS &&
        existingRecord.inProgressExpiryTimestamp &&
        existingRecord.inProgressExpiryTimestamp > now
      ) {
        throw new IdempotencyItemAlreadyExistsError(
          `Failed to put record for in-progress idempotency key: ${record.idempotencyKey}`,
          existingRecord
        );
      }

      /** Reaching this point indicates that the idempotency record found is an orphan record. An orphan record is
       * one that is neither completed nor in-progress within its expected time frame. It may result from a
       * previous invocation that has timed out or an expired record that has yet to be cleaned up by Redis.
       * We raise an error to handle this exceptional scenario appropriately.
       */
      throw new IdempotencyPersistenceConsistencyError(
        'Orphaned record detected'
      );
    } catch (error) {
      if (error instanceof IdempotencyPersistenceConsistencyError) {
        /** Handle an orphan record by attempting to acquire a lock, which by default lasts for 10 seconds.
         * The purpose of acquiring the lock is to prevent race conditions with other processes that might
         * also be trying to handle the same orphan record. Once the lock is acquired, we set a new value
         * for the idempotency record in Redis with the appropriate time-to-live (TTL).
         */
        await this.#acquireLock(record.idempotencyKey);

        console.debug('Lock acquired, updating record');
        await this.#client.set(record.idempotencyKey, encodedItem, {
          EX: ttl,
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Calculates the number of seconds remaining until a specified expiry timestamp
   */
  #getExpirySeconds(expiryTimestamp?: number): number {
    if (expiryTimestamp) {
      return expiryTimestamp - Math.floor(Date.now() / 1000);
    }
    return this.expiresAfterSeconds;
  }

  /**
   * Attempt to acquire a lock for a specified resource name, with a default timeout.
   * This method attempts to set a lock using Redis to prevent concurrent
   * access to a resource identified by 'idempotencyKey'. It uses the 'NX' flag to ensure that
   * the lock is only set if it does not already exist, thereby enforcing mutual exclusion.
   *
   * @param idempotencyKey - The key to create a lock for
   */
  async #acquireLock(idempotencyKey: string): Promise<void> {
    const lockKey = `${idempotencyKey}:lock`;
    const lockValue = 'true';

    console.debug('Acquiring lock to overwrite orphan record');
    const acquired = await this.#client.set(lockKey, lockValue, {
      EX: this.#orphanLockTimeout,
      NX: true,
    });

    if (acquired) return;
    // If the lock acquisition fails, it suggests a race condition has occurred. In this case, instead of
    // proceeding, we log the event and raise an error to indicate that the current operation should be
    // retried after the lock is released by the process that currently holds it.
    console.debug('Lock acquisition failed, raise to retry');
    throw new IdempotencyItemAlreadyExistsError(
      'Lock acquisition failed, raise to retry'
    );
  }
}

export { RedisPersistenceLayer };
