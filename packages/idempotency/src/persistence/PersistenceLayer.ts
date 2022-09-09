/* eslint-disable @typescript-eslint/no-empty-function */
import { PersistenceLayerInterface } from './PersistenceLayerInterface';

class IdempotencyRecord {
  public constructor(public idempotencyKey: string,
    private status: string = '',
    public expiryTimestamp: number | undefined,
    public inProgressExpiryTimestamp: number | undefined,
    public responseData: string = '',
    public payloadHash: string | undefined) {}

  public isExpired(): boolean {
    return false;
  }

  public responseJsonAsObject(): Record<string, unknown> | undefined {
    return;
  }

  public getStatus(): string {
    return '';
  }
}

abstract class PersistenceLayer implements PersistenceLayerInterface {
  public constructor() { }
  public configure(_functionName: string = ''): void {}
  public async deleteRecord(): Promise<void> { }
  public async getRecord(): Promise<IdempotencyRecord> {
    return Promise.resolve({} as IdempotencyRecord);
  }
  public async saveInProgress(): Promise<void> { }
  public async saveSuccess(): Promise<void> { }

  protected abstract _deleteRecord(): Promise<void>;
  protected abstract _getRecord(): Promise<IdempotencyRecord>;
  protected abstract _putRecord(record: IdempotencyRecord): Promise<void>;
  protected abstract _updateRecord(): Promise<void>;
}

export {
  IdempotencyRecord,
  PersistenceLayer
};