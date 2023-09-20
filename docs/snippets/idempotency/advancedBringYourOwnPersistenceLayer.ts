import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
  IdempotencyRecordStatus,
} from '@aws-lambda-powertools/idempotency';
import { IdempotencyRecordOptions } from '@aws-lambda-powertools/idempotency/types';
import {
  IdempotencyRecord,
  BasePersistenceLayer,
} from '@aws-lambda-powertools/idempotency/persistence';
import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
import { Transform } from '@aws-lambda-powertools/parameters';
import {
  ProviderClient,
  ProviderItemAlreadyExists,
} from './advancedBringYourOwnPersistenceLayerProvider';
import type { ApiSecret, ProviderItem } from './types';

class CustomPersistenceLayer extends BasePersistenceLayer {
  #collectionName: string;
  #client?: ProviderClient;

  public constructor(config: { collectionName: string }) {
    super();
    this.#collectionName = config.collectionName;
  }

  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
    await (
      await this.#getClient()
    ).delete(this.#collectionName, record.idempotencyKey);
  }

  protected async _getRecord(
    idempotencyKey: string
  ): Promise<IdempotencyRecord> {
    try {
      const item = await (
        await this.#getClient()
      ).get(this.#collectionName, idempotencyKey);

      return new IdempotencyRecord({
        ...(item as unknown as IdempotencyRecordOptions),
      });
    } catch (error) {
      throw new IdempotencyItemNotFoundError();
    }
  }

  protected async _putRecord(record: IdempotencyRecord): Promise<void> {
    const item: Partial<ProviderItem> = {
      status: record.getStatus(),
    };

    if (record.inProgressExpiryTimestamp !== undefined) {
      item.in_progress_expiration = record.inProgressExpiryTimestamp;
    }

    if (this.isPayloadValidationEnabled() && record.payloadHash !== undefined) {
      item.validation = record.payloadHash;
    }

    const ttl = record.expiryTimestamp
      ? Math.floor(new Date(record.expiryTimestamp * 1000).getTime() / 1000) -
        Math.floor(new Date().getTime() / 1000)
      : this.getExpiresAfterSeconds();

    let existingItem: ProviderItem | undefined;
    try {
      existingItem = await (
        await this.#getClient()
      ).put(this.#collectionName, record.idempotencyKey, item, {
        ttl,
      });
    } catch (error) {
      if (error instanceof ProviderItemAlreadyExists) {
        if (
          existingItem &&
          existingItem.status !== IdempotencyRecordStatus.INPROGRESS &&
          (existingItem.in_progress_expiration || 0) < Date.now()
        ) {
          throw new IdempotencyItemAlreadyExistsError(
            `Failed to put record for already existing idempotency key: ${record.idempotencyKey}`
          );
        }
      }
    }
  }

  protected async _updateRecord(record: IdempotencyRecord): Promise<void> {
    const value: Partial<ProviderItem> = {
      data: JSON.stringify(record.responseData),
      status: record.getStatus(),
    };

    if (this.isPayloadValidationEnabled()) {
      value.validation = record.payloadHash;
    }

    await (
      await this.#getClient()
    ).update(this.#collectionName, record.idempotencyKey, value);
  }

  async #getClient(): Promise<ProviderClient> {
    if (this.#client) return this.#client;

    const secretName = process.env.API_SECRET;
    if (!secretName) {
      throw new Error('API_SECRET environment variable is not set');
    }

    const apiSecret = await getSecret<ApiSecret>(secretName, {
      transform: Transform.JSON,
    });

    if (!apiSecret) {
      throw new Error(`Could not retrieve secret ${secretName}`);
    }

    this.#client = new ProviderClient({
      apiKey: apiSecret.apiKey,
      defaultTtlSeconds: this.getExpiresAfterSeconds(),
    });

    return this.#client;
  }
}

export { CustomPersistenceLayer };
