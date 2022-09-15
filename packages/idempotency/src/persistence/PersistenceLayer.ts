/* eslint-disable @typescript-eslint/no-empty-function */
import { IdempotencyRecord } from './IdempotencyRecord';
import { PersistenceLayerInterface } from './PersistenceLayerInterface';

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