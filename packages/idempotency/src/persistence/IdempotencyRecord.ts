import { IdempotencyRecordOptions } from 'types/IdempotencyRecordOptions';
import { IdempotencyInvalidStatusError } from '../Exceptions';
import { IdempotencyRecordStatus } from '../types/IdempotencyRecordStatus';

class IdempotencyRecord {
  public expiryTimestamp: number | undefined;
  public idempotencyKey: string;
  public inProgressExpiryTimestamp: number | undefined;
  public payloadHash: string | undefined;
  public responseData: Record<string, unknown> | undefined;
  private status: IdempotencyRecordStatus;

  public constructor(constructorOptions: IdempotencyRecordOptions) { 
    this.idempotencyKey = constructorOptions.idempotencyKey;
    this.expiryTimestamp = constructorOptions.expiryTimestamp;
    this.inProgressExpiryTimestamp = constructorOptions.inProgressExpiryTimestamp;
    this.responseData = constructorOptions.responseData;
    this.payloadHash = constructorOptions.payloadHash;
    this.status = constructorOptions.status;
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
      throw new IdempotencyInvalidStatusError();
    }
  }

  private isExpired(): boolean {
    return this.expiryTimestamp !== undefined && ((Date.now() / 1000) > this.expiryTimestamp);
  }
}

export {
  IdempotencyRecord
};