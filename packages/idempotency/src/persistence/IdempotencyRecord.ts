import { IdempotencyRecordStatus } from 'types/IdempotencyRecordStatus';

class IdempotencyRecord {

  public constructor(public idempotencyKey: string,
    private status: IdempotencyRecordStatus,
    public expiryTimestamp: number | undefined,
    public inProgressExpiryTimestamp: number | undefined,
    public responseData: string |undefined, 
    public payloadHash: string | undefined) {}
      
  public getStatus(): IdempotencyRecordStatus {
    return IdempotencyRecordStatus.INPROGRESS;
  }
    
  public isExpired(): boolean {
    return false;
  }
    
  public responseJsonAsObject(): Record<string, unknown> | undefined {
    return;
  } 
}

export {
  IdempotencyRecord
};