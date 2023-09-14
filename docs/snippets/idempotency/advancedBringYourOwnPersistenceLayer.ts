import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
  IdempotencyRecordStatus,
} from '@aws-lambda-powertools/idempotency';
import {
  IdempotencyRecordOptions,
  IdempotencyRecordStatusValue,
} from '@aws-lambda-powertools/idempotency/types';
import {
  IdempotencyRecord,
  BasePersistenceLayer,
} from '@aws-lambda-powertools/idempotency/persistence';
import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
import { Transform } from '@aws-lambda-powertools/parameters';
import {
  CacheClient,
  CredentialProvider,
  Configurations,
  CacheGet,
  CacheKeyExists,
  CollectionTtl,
  CacheDictionarySetFields,
  CacheDictionaryGetFields,
} from '@gomomento/sdk';
import type { MomentoApiSecret, Item } from './types';

class MomentoCachePersistenceLayer extends BasePersistenceLayer {
  #cacheName: string;
  #client?: CacheClient;

  public constructor(config: { cacheName: string }) {
    super();
    this.#cacheName = config.cacheName;
  }

  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
    await (
      await this.#getClient()
    ).delete(this.#cacheName, record.idempotencyKey);
  }

  protected async _getRecord(
    idempotencyKey: string
  ): Promise<IdempotencyRecord> {
    const response = await (
      await this.#getClient()
    ).dictionaryFetch(this.#cacheName, idempotencyKey);

    if (
      response instanceof CacheGet.Error ||
      response instanceof CacheGet.Miss
    ) {
      throw new IdempotencyItemNotFoundError();
    }
    const { data, ...rest } =
      response.value() as unknown as IdempotencyRecordOptions & {
        data: string;
      };

    return new IdempotencyRecord({
      responseData: JSON.parse(data),
      ...rest,
    });
  }

  protected async _putRecord(record: IdempotencyRecord): Promise<void> {
    const item: Partial<Item> = {
      status: record.getStatus(),
    };

    if (record.inProgressExpiryTimestamp !== undefined) {
      item.in_progress_expiration = record.inProgressExpiryTimestamp.toString();
    }

    if (this.isPayloadValidationEnabled() && record.payloadHash !== undefined) {
      item.validation = record.payloadHash;
    }

    try {
      const lock = await this.#lookupItem(record.idempotencyKey);

      if (
        lock.getStatus() !== IdempotencyRecordStatus.INPROGRESS &&
        (lock.inProgressExpiryTimestamp || 0) < Date.now()
      ) {
        throw new IdempotencyItemAlreadyExistsError(
          `Failed to put record for already existing idempotency key: ${record.idempotencyKey}`
        );
      }
    } catch (error) {
      if (error instanceof IdempotencyItemAlreadyExistsError) {
        throw error;
      }
    }

    try {
      const ttl = record.expiryTimestamp
        ? Math.floor(new Date(record.expiryTimestamp * 1000).getTime() / 1000) -
          Math.floor(new Date().getTime() / 1000)
        : this.getExpiresAfterSeconds();

      const response = await (
        await this.#getClient()
      ).dictionarySetFields(this.#cacheName, record.idempotencyKey, item, {
        ttl: CollectionTtl.of(ttl).withNoRefreshTtlOnUpdates(),
      });

      if (response instanceof CacheDictionarySetFields.Error) {
        throw new Error(`Unable to put item: ${response.errorCode()}`);
      }
    } catch (error) {
      throw error;
    }
  }

  protected async _updateRecord(record: IdempotencyRecord): Promise<void> {
    const value: Partial<Item> = {
      data: JSON.stringify(record.responseData),
      status: record.getStatus(),
    };

    if (this.isPayloadValidationEnabled()) {
      value.validation = record.payloadHash;
    }

    await this.#checkItemExists(record.idempotencyKey);

    await (
      await this.#getClient()
    ).dictionarySetFields(this.#cacheName, record.idempotencyKey, value, {
      ttl: CollectionTtl.refreshTtlIfProvided().withNoRefreshTtlOnUpdates(),
    });
  }

  async #getMomentoApiSecret(): Promise<MomentoApiSecret> {
    const secretName = process.env.MOMENTO_API_SECRET;
    if (!secretName) {
      throw new Error('MOMENTO_API_SECRET environment variable is not set');
    }

    const apiSecret = await getSecret<MomentoApiSecret>(secretName, {
      transform: Transform.JSON,
    });

    if (!apiSecret) {
      throw new Error(`Could not retrieve secret ${secretName}`);
    }

    return apiSecret;
  }

  async #getClient(): Promise<CacheClient> {
    if (this.#client) return this.#client;

    const apiSecret = await this.#getMomentoApiSecret();
    this.#client = await CacheClient.create({
      configuration: Configurations.InRegion.LowLatency.latest(),
      credentialProvider: CredentialProvider.fromString({
        apiKey: apiSecret.apiKey,
      }),
      defaultTtlSeconds: this.getExpiresAfterSeconds(),
    });

    return this.#client;
  }

  async #checkItemExists(idempotencyKey: string): Promise<boolean> {
    const response = await (
      await this.#getClient()
    ).keysExist(this.#cacheName, [idempotencyKey]);

    return response instanceof CacheKeyExists.Success;
  }

  async #lookupItem(idempotencyKey: string): Promise<IdempotencyRecord> {
    const response = await (
      await this.#getClient()
    ).dictionaryGetFields(this.#cacheName, idempotencyKey, [
      'in_progress_expiration',
      'status',
    ]);

    if (response instanceof CacheDictionaryGetFields.Miss) {
      throw new IdempotencyItemNotFoundError();
    } else if (response instanceof CacheDictionaryGetFields.Error) {
      throw new Error('Unable to get item');
    } else {
      const { status, in_progress_expiration: inProgressExpiryTimestamp } =
        response.value() || {};

      if (status !== undefined || inProgressExpiryTimestamp !== undefined) {
        throw new Error('Unable');
      }

      return new IdempotencyRecord({
        idempotencyKey,
        status: status as IdempotencyRecordStatusValue,
        inProgressExpiryTimestamp: parseFloat(inProgressExpiryTimestamp),
      });
    }
  }
}

export { MomentoCachePersistenceLayer };
