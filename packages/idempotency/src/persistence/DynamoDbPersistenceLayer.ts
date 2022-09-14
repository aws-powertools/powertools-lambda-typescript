/* eslint-disable @typescript-eslint/no-empty-function */
import { PersistenceLayer } from './PersistenceLayer';
import { IdempotencyRecord } from './IdempotencyRecord';

class DynamoDBPersistenceLayer extends PersistenceLayer {
<<<<<<< Updated upstream
  public constructor(_tableName: string, _key_attr: string = 'id') {
    super();
=======
  constructor(private tableName: string, private key_attr: string = 'id') {
    super()
>>>>>>> Stashed changes
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