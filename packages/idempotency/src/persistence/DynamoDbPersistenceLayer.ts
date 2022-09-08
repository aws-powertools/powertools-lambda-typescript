/* eslint-disable @typescript-eslint/no-empty-function */
import { PersistenceLayer } from './PersistenceLayer';

class DynamoDBPersistenceLayer extends PersistenceLayer {
  protected _deleteRecord(): void {}
  protected _getRecord(): void {}
  protected _putRecord(): void {}
  protected _updateRecord(): void {}
}

export {
  DynamoDBPersistenceLayer
};