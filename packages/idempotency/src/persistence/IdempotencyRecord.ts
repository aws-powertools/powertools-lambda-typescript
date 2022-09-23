import { IdempotencyInvalidStatusError } from '../Exceptions';
import { IdempotencyRecordStatus } from '../types/IdempotencyRecordStatus';

class IdempotencyRecord {

  public constructor(public idempotencyKey: string,
    private status: IdempotencyRecordStatus,
    public expiryTimestamp: number | undefined,
    public inProgressExpiryTimestamp: number | undefined,
    public responseData: Record<string, unknown> |undefined, 
    public payloadHash: string | undefined) {}
      
  public getStatus(): IdempotencyRecordStatus {
    if (this.isExpired()){
      return IdempotencyRecordStatus.EXPIRED;
    } else if (Object.values(IdempotencyRecordStatus).includes(this.status)){
      return this.status;
    } else {
      throw new IdempotencyInvalidStatusError();
    }
  }

  public responseJsonAsObject(): Record<string, unknown> | undefined {
    return this.responseData;
  } 
    
  private isExpired(): boolean {
    return this.expiryTimestamp !== undefined && (Date.now() > this.expiryTimestamp);
  }
}

export {
  IdempotencyRecord
};