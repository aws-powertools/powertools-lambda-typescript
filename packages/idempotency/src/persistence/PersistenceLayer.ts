/* eslint-disable @typescript-eslint/no-empty-function */
import { IdempotencyPersistenceConfig } from '../IdempotencyPersistenceConfig';
import { PersistenceLayerInterface } from './PersistenceLayerInterface';

class IdempotencyRecord{
  public constructor(){}

  public isExpired(): boolean{
    return false;
  }
  
  public responseJsonAsObject(): Record<string, unknown> | undefined{
    return;
  }

  public status(): string{
    return '';
  }
}

abstract class PersistenceLayer implements PersistenceLayerInterface {
  public constructor(){}
  public configure(_config: IdempotencyPersistenceConfig): void {}
  public async deleteRecord(): Promise<void> {}
  public async getRecord(): Promise<IdempotencyRecord> {
    return Promise.resolve({} as IdempotencyRecord);
  }
  public async saveInProgress(): Promise<void> {}
  public async saveSuccess(): Promise<void> {}

  protected abstract _deleteRecord(): Promise<void>;
  protected abstract _getRecord(): Promise<IdempotencyRecord>;
  protected abstract _putRecord(): Promise<void>;
  protected abstract _updateRecord(): Promise<void>;
}

export {
  IdempotencyRecord,
  PersistenceLayer
};