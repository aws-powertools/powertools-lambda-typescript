/* eslint-disable @typescript-eslint/no-empty-function */
import { IdempotencyRecord, PersistenceLayer } from './PersistenceLayer';

class DynamoDBPersistenceLayer extends PersistenceLayer {
  protected async _deleteRecord(): Promise<void> {}
  protected async _getRecord(): Promise<IdempotencyRecord> {
    return Promise.resolve({} as IdempotencyRecord);
  }
  protected async _putRecord(): Promise<void> {}
  protected async _updateRecord(): Promise<void> {}
}

export {
  DynamoDBPersistenceLayer
};