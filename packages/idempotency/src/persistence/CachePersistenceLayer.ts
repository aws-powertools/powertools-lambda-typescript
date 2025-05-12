import {
  IdempotencyRecordStatus,
  PERSISTENCE_ATTRIBUTE_KEY_MAPPINGS,
} from '../constants.js';
import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
  IdempotencyPersistenceConsistencyError,
  IdempotencyUnknownError,
} from '../errors.js';
import type {
  CacheClient,
  CachePersistenceOptions,
} from '../types/CachePersistence.js';
import type { IdempotencyRecordStatusValue } from '../types/IdempotencyRecord.js';
import { BasePersistenceLayer } from './BasePersistenceLayer.js';
import { IdempotencyRecord } from './IdempotencyRecord.js';

/**
 * Valey- and Redis OOS-compatible persistence layer for idempotency records.
 *
 * This class uses a cache client to write and read idempotency records. It supports any client that
 * implements the {@link CacheClient | `CacheClient`} interface.
 *
 * There are various options to configure the persistence layer, such as attribute names for storing
 * status, expiry, data, and validation keys in the cache.
 *
 * You must provide your own connected client instance by passing it through the `client` option.
 *
 * See the {@link https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/ Idempotency documentation}
 * for more details on the configuration and usage patterns.
 *
 * **Using Valkey Glide Client**
 *
 * @example
 * ```ts
 * import { GlideClient } from '@valkey/valkey-glide';
 * import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
 *
 * const client = await GlideClient.createClient({
 *   addresses: [{
 *     host: process.env.CACHE_ENDPOINT,
 *     port: Number(process.env.CACHE_PORT),
 *   }],
 *   useTLS: true,
 * });
 *
 * const persistence = new CachePersistenceLayer({
 *   client,
 * });
 *
 * // ... your function handler here
 * ```
 *
 * **Using Redis Client**
 *
 * @example
 * ```ts
 * import { createClient } from '@redis/client';
 * import { CachePersistenceLayer } from '@aws-lambda-powertools/idempotency/cache';
 *
 * const client = await createClient({
 *   url: `rediss://${process.env.CACHE_ENDPOINT}:${process.env.CACHE_PORT}`,
 *   username: 'default',
 * }).connect();
 *
 * const persistence = new CachePersistenceLayer({
 *   client,
 * });
 *
 * // ... your function handler here
 * ```
 *
 * @category Persistence Layer
 */
class CachePersistenceLayer extends BasePersistenceLayer {
  readonly #client: CacheClient;
  readonly #dataAttr: string;
  readonly #expiryAttr: string;
  readonly #inProgressExpiryAttr: string;
  readonly #statusAttr: string;
  readonly #validationKeyAttr: string;
  readonly #orphanLockTimeout: number;

  public constructor(options: CachePersistenceOptions) {
    super();

    this.#statusAttr =
      options.statusAttr ?? PERSISTENCE_ATTRIBUTE_KEY_MAPPINGS.statusAttr;
    this.#expiryAttr =
      options.expiryAttr ?? PERSISTENCE_ATTRIBUTE_KEY_MAPPINGS.expiryAttr;
    this.#inProgressExpiryAttr =
      options.inProgressExpiryAttr ??
      PERSISTENCE_ATTRIBUTE_KEY_MAPPINGS.inProgressExpiryAttr;
    this.#dataAttr =
      options.dataAttr ?? PERSISTENCE_ATTRIBUTE_KEY_MAPPINGS.dataAttr;
    this.#validationKeyAttr =
      options.validationKeyAttr ??
      PERSISTENCE_ATTRIBUTE_KEY_MAPPINGS.validationKeyAttr;
    this.#orphanLockTimeout = Math.min(10, this.expiresAfterSeconds);
    this.#client = options.client;
  }

  /**
   * Deletes the idempotency record associated with a given record from the persistence store.
   *
   * This function is designed to be called after a Lambda handler invocation has completed processing.
   * It ensures that the idempotency key associated with the record is removed from the cache to
   * prevent future conflicts and to maintain the idempotency integrity.
   *
   * Note: it is essential that the idempotency key is not empty, as that would indicate the Lambda
   * handler has not been invoked or the key was not properly set.
   *
   * @param record
   */
  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
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
    try {
      const item = JSON.parse(response as string);
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
    } catch (error) {
      throw new IdempotencyPersistenceConsistencyError(
        'Idempotency persistency consistency error, needs to be removed',
        error as Error
      );
    }
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
   * Put a record in the persistence store with a status of "INPROGRESS".
   *
   * The method guards against concurrent execution by using conditional write operations.
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

    try {
      /**
       * |     LOCKED     |         RETRY if status = "INPROGRESS"                |     RETRY
       * |----------------|-------------------------------------------------------|-------------> .... (time)
       * |             Lambda                                              Idempotency Record
       * |             Timeout                                                 Timeout
       * |       (in_progress_expiry)                                          (expiry)
       *
       * Conditions to successfully save a record:
       *
       * The idempotency key does not exist:
       *   - first time that this invocation key is used
       *   - previous invocation with the same key was deleted due to TTL
       *   - SET see {@link https://valkey.io/commands/set/ | Valkey SET command}
       */
      const response = await this.#client.set(
        record.idempotencyKey,
        encodedItem,
        {
          EX: ttl,
          NX: true,
        }
      );

      /**
       * If response is not `null`, the SET operation was successful and the idempotency key was not
       * previously set. This indicates that we can safely proceed to the handler execution phase.
       * Most invocations should successfully proceed past this point.
       */
      if (response !== null) {
        return;
      }

      /**
       * If response is `null`, it indicates an existing record in the cache for the given idempotency key.
       *
       * This could be due to:
       *   - An active idempotency record from a previous invocation that has not yet expired.
       *   - An orphan record where a previous invocation has timed out.
       *   - An expired idempotency record that has not been deleted yet.
       *
       * In any case, we proceed to retrieve the record for further inspection.
       */
      const existingRecord = await this._getRecord(record.idempotencyKey);

      /**
       * If the status of the idempotency record is `COMPLETED` and the record has not expired
       * then a valid completed record exists. We raise an error to prevent duplicate processing
       * of a request that has already been completed successfully.
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

      /**
       * If the idempotency record has a status of 'INPROGRESS' and has a valid `inProgressExpiryTimestamp`
       * (meaning the timestamp is greater than the current timestamp in milliseconds), then we have encountered
       * a valid in-progress record. This indicates that another process is currently handling the request, and
       * to maintain idempotency, we raise an error to prevent concurrent processing of the same request.
       */
      if (
        existingRecord.getStatus() === IdempotencyRecordStatus.INPROGRESS &&
        existingRecord.inProgressExpiryTimestamp &&
        existingRecord.inProgressExpiryTimestamp > Date.now()
      ) {
        throw new IdempotencyItemAlreadyExistsError(
          `Failed to put record for in-progress idempotency key: ${record.idempotencyKey}`,
          existingRecord
        );
      }

      /**
       * Reaching this point indicates that the idempotency record found is an orphan record. An orphan record is
       * one that is neither completed nor in-progress within its expected time frame. It may result from a
       * previous invocation that has timed out or an expired record that has yet to be cleaned up from the cache.
       * We raise an error to handle this exceptional scenario appropriately.
       */
      throw new IdempotencyPersistenceConsistencyError(
        'Orphaned record detected'
      );
    } catch (error) {
      if (error instanceof IdempotencyPersistenceConsistencyError) {
        /**
         * Handle an orphan record by attempting to acquire a lock, which by default lasts for 10 seconds.
         * The purpose of acquiring the lock is to prevent race conditions with other processes that might
         * also be trying to handle the same orphan record. Once the lock is acquired, we set a new value
         * for the idempotency record in the cache with the appropriate time-to-live (TTL).
         */
        await this.#acquireLock(record.idempotencyKey);

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
   * This method attempts to set a lock to prevent concurrent access to a resource
   * identified by 'idempotencyKey'. It uses the 'NX' flag to ensure that the lock is only
   * set if it does not already exist, thereby enforcing mutual exclusion.
   *
   * @param idempotencyKey - The key to create a lock for
   */
  async #acquireLock(idempotencyKey: string): Promise<void> {
    const lockKey = `${idempotencyKey}:lock`;
    const lockValue = 'true';

    const acquired = await this.#client.set(lockKey, lockValue, {
      EX: this.#orphanLockTimeout,
      NX: true,
    });

    if (acquired) return;
    /** If the lock acquisition fails, it suggests a race condition has occurred. In this case, instead of
     *  proceeding, we log the event and raise an error to indicate that the current operation should be
     *  retried after the lock is released by the process that currently holds it.
     */
    throw new IdempotencyItemAlreadyExistsError(
      'Lock acquisition failed, raise to retry'
    );
  }
}

export { CachePersistenceLayer };
