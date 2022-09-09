/* eslint-disable @typescript-eslint/no-empty-function */
import { IdempotencyRecord, PersistenceLayer } from './PersistenceLayer';

class DynamoDBPersistenceLayer extends PersistenceLayer {
  public constructor(_tableName: string, _key_attr: string = 'id') {
    super();
  }
  protected async _deleteRecord(): Promise<void> {}
  protected async _getRecord(): Promise<IdempotencyRecord> {
    return Promise.resolve({} as IdempotencyRecord);
  }
  protected async _putRecord(_record: IdempotencyRecord): Promise<void> {}
  protected async _updateRecord(): Promise<void> {}
}

export {
  DynamoDBPersistenceLayer
};