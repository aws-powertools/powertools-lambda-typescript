import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { IdempotencyRecordStatus } from '../constants.js';
import { IdempotencyInvalidStatusError } from '../errors.js';
import type {
  IdempotencyRecordOptions,
  IdempotencyRecordStatusValue,
} from '../types/IdempotencyRecord.js';
import type { DynamoDBPersistenceLayer } from './DynamoDBPersistenceLayer.js';

/**
 * Class representing an idempotency record.
 * The properties of this class will be reflected in the persistence layer.
 */
class IdempotencyRecord {
  /**
   * The expiry timestamp of the record in seconds UTC.
   */
  public expiryTimestamp?: number;
  /**
   * The idempotency key of the record that is used to identify the record.
   */
  public idempotencyKey: string;
  /**
   * An optional sort key that can be used with the {@link DynamoDBPersistenceLayer | `DynamoDBPersistenceLayer`}.
   */
  public sortKey?: string;
  /**
   * The expiry timestamp of the in progress record in milliseconds UTC.
   */
  public inProgressExpiryTimestamp?: number;
  /**
   * The hash of the payload of the request, used for comparing requests.
   */
  public payloadHash?: string;
  /**
   * The response data of the request, this will be returned if the payload hash matches.
   */
  public responseData?: JSONValue;
  /**
   * The idempotency record status can be COMPLETED, IN_PROGRESS or EXPIRED.
   * We check the status during idempotency processing to make sure we don't process an expired record and handle concurrent requests.
   * {@link constants.IdempotencyRecordStatusValue | IdempotencyRecordStatusValue}
   * @private
   */
  private status: IdempotencyRecordStatusValue;

  public constructor(config: IdempotencyRecordOptions) {
    this.idempotencyKey = config.idempotencyKey;
    this.expiryTimestamp = config.expiryTimestamp;
    this.inProgressExpiryTimestamp = config.inProgressExpiryTimestamp;
    this.responseData = config.responseData;
    this.payloadHash = config.payloadHash;
    this.status = config.status;
    this.sortKey = config.sortKey;
  }

  /**
   * Get the response data of the record.
   */
  public getResponse(): JSONValue {
    return this.responseData;
  }

  /**
   * Get the status of the record.
   * @throws {IdempotencyInvalidStatusError} If the status is not a valid status.
   */
  public getStatus(): IdempotencyRecordStatusValue {
    if (this.isExpired()) {
      return IdempotencyRecordStatus.EXPIRED;
    }
    if (Object.values(IdempotencyRecordStatus).includes(this.status)) {
      return this.status;
    }
    throw new IdempotencyInvalidStatusError(this.status);
  }

  /**
   * Returns true if the record is expired or undefined.
   */
  public isExpired(): boolean {
    return (
      this.expiryTimestamp !== undefined &&
      Date.now() / 1000 > this.expiryTimestamp
    );
  }
}

export { IdempotencyRecord };
