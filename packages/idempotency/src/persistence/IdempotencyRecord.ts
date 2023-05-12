import { IdempotencyRecordStatus } from '../types';
import type { IdempotencyRecordOptions } from '../types';
import { IdempotencyInvalidStatusError } from '../Exceptions';

/**
 * Class representing an idempotency record
 */
class IdempotencyRecord {
  public expiryTimestamp?: number;
  public idempotencyKey: string;
  public inProgressExpiryTimestamp?: number;
  public payloadHash?: string;
  public responseData?: Record<string, unknown>;
  private status: IdempotencyRecordStatus;

  public constructor(config: IdempotencyRecordOptions) {
    this.idempotencyKey = config.idempotencyKey;
    this.expiryTimestamp = config.expiryTimestamp;
    this.inProgressExpiryTimestamp = config.inProgressExpiryTimestamp;
    this.responseData = config.responseData;
    this.payloadHash = config.payloadHash;
    this.status = config.status;
  }

  public getResponse(): Record<string, unknown> | undefined {
    return this.responseData;
  }

  public getStatus(): IdempotencyRecordStatus {
    if (this.isExpired()) {
      return IdempotencyRecordStatus.EXPIRED;
    } else if (Object.values(IdempotencyRecordStatus).includes(this.status)) {
      return this.status;
    } else {
      throw new IdempotencyInvalidStatusError(this.status);
    }
  }

  public isExpired(): boolean {
    return (
      this.expiryTimestamp !== undefined &&
      Date.now() / 1000 > this.expiryTimestamp
    );
  }
}

export { IdempotencyRecord };
