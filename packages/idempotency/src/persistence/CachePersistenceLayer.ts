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
  CacheClientSetOptions,
  CachePersistenceOptions,
} from '../types/CachePersistence.js';
import type { IdempotencyRecordStatusValue } from '../types/IdempotencyRecord.js';
import { BasePersistenceLayer } from './BasePersistenceLayer.js';
import { IdempotencyRecord } from './IdempotencyRecord.js';

/**
 * Valkey and Redis OOS-compatible persistence layer for idempotency records.
 *
 * This class uses a cache client to write and read idempotency records. It supports any client that
 * implements the {@link CacheClient | `CacheClient`} interface.
 *
 * There are various options to configure the persistence layer, such as attribute names for storing
 * status, expiry, data, and validation keys in the cache.
 *
 * You must provide your own connected client instance by passing it through the `client` option.
 *
 * See the {@link https://docs.aws.amazon.com/powertools/typescript/latest/features/idempotency/ Idempotency documentation}
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
 *     host: String(process.env.CACHE_ENDPOINT),
 *     port: Number(process.env.CACHE_PORT),
 *   }],
 *   useTLS: true,
 *   requestTimeout: 2000
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
    const encodedItem = this.#encodeRecord(record);
    const ttl = this.#getExpirySeconds(record.expiryTimestamp);
    // Need to set ttl again, if we don't set the expiry here the record will not have a ttl
    await this.#client.set(
      record.idempotencyKey,
      encodedItem,
      this.#getSetOptions(ttl)
    );
  }

  /**
   * Serialize a record into the JSON value stored in the cache.
   *
   * Undefined fields are omitted by `JSON.stringify`, so the same shape serves
   * both in-progress and completed records.
   *
   * @param record - The record to serialize
   */
  #encodeRecord(record: IdempotencyRecord): string {
    const item: Record<string, unknown> = {
      [this.#statusAttr]: record.getStatus(),
      [this.#expiryAttr]: record.expiryTimestamp,
      [this.#inProgressExpiryAttr]: record.inProgressExpiryTimestamp,
      [this.#dataAttr]: record.responseData,
    };

    if (this.isPayloadValidationEnabled() && record.payloadHash !== undefined) {
      item[this.#validationKeyAttr] = record.payloadHash;
    }

    return JSON.stringify(item);
  }

  /**
   * Put a record in the persistence store with a status of "INPROGRESS".
   *
   * The record is written only if the key is absent. Its TTL ends at the execution
   * deadline when one is known, so the record of an invocation that timed out is
   * removed by the cache and the key can be acquired again by a single conditional
   * write. A record that is still present is handed to the caller, which decides
   * from its status whether to return the stored result or reject the request.
   *
   * @param record - The in-progress record to write
   * @param isRetry - Whether this is the retry after the existing record disappeared
   */
  async #putInProgressRecord(
    record: IdempotencyRecord,
    isRetry = false
  ): Promise<void> {
    const response = await this.#client.set(
      record.idempotencyKey,
      this.#encodeRecord(record),
      this.#getSetIfNotExistsOptions(this.#getInProgressExpirySeconds(record))
    );
    if (response !== null) {
      return;
    }

    let existingRecord: IdempotencyRecord;
    try {
      existingRecord = await this._getRecord(record.idempotencyKey);
    } catch (error) {
      // The existing record expired between the write and the read.
      if (error instanceof IdempotencyItemNotFoundError && !isRetry) {
        return this.#putInProgressRecord(record, true);
      }
      throw error;
    }

    throw new IdempotencyItemAlreadyExistsError(
      `Failed to put record for already existing idempotency key: ${record.idempotencyKey}`,
      existingRecord
    );
  }

  /**
   * Builds the options for a `SET` command in the shapes of both supported clients.
   *
   * `@redis/client` reads `EX` and `NX`, while `@valkey/valkey-glide` reads `expiry` and
   * `conditionalSet`. Each client ignores the properties of the other, so passing only one shape
   * would silently write the key without a TTL on the other client.
   *
   * @param ttl - The expiry time of the key in seconds
   */
  #getSetOptions(ttl: number): CacheClientSetOptions {
    return {
      EX: ttl,
      expiry: { type: 'EX', count: ttl },
    };
  }

  /**
   * Builds the options for a `SET` command that only writes the key if it does not already exist,
   * in the shapes of both supported clients.
   *
   * On top of the expiry from {@link CachePersistenceLayer.#getSetOptions | `#getSetOptions()`},
   * `@redis/client` reads `NX` and `@valkey/valkey-glide` reads `conditionalSet`.
   *
   * @param ttl - The expiry time of the key in seconds
   */
  #getSetIfNotExistsOptions(ttl: number): CacheClientSetOptions {
    return {
      ...this.#getSetOptions(ttl),
      NX: true,
      conditionalSet: 'onlyIfDoesNotExist',
    };
  }

  /**
   * Calculates the whole seconds until a record's overall expiry, rounded down so the
   * key never outlives the record it holds.
   *
   * @param expiryTimestamp - The overall expiry, in seconds since the epoch
   */
  #getExpirySeconds(expiryTimestamp?: number): number {
    if (expiryTimestamp) {
      return Math.max(1, Math.floor(expiryTimestamp - Date.now() / 1000));
    }
    return this.expiresAfterSeconds;
  }

  /**
   * Calculates the whole seconds an in-progress record is kept: until its execution
   * deadline, rounded up so the key is never removed while the invocation can still run,
   * and capped at the overall expiry. Without a deadline, the overall expiry applies.
   *
   * @param record - The in-progress record
   */
  #getInProgressExpirySeconds(record: IdempotencyRecord): number {
    const expirySeconds = this.#getExpirySeconds(record.expiryTimestamp);
    if (record.inProgressExpiryTimestamp === undefined) {
      return expirySeconds;
    }
    const deadlineSeconds = Math.ceil(
      (record.inProgressExpiryTimestamp - Date.now()) / 1000
    );

    return Math.max(1, Math.min(deadlineSeconds, expirySeconds));
  }
}

export { CachePersistenceLayer };
