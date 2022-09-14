/* eslint-disable @typescript-eslint/no-empty-function */
import { PersistenceLayer } from './PersistenceLayer';
import { IdempotencyRecord } from './IdempotencyRecord';

class DynamoDBPersistenceLayer extends PersistenceLayer {
  public constructor(private tableName: string, private key_attr: string = 'id', 
    private status_attr: string = 'status', private expiry_attr: string = 'expiration', 
    private in_progress_expiry_attr: string = 'in_progress_expiry_attr',
    private data_attr: string = 'data' ) {
    super();
  }
  protected async _deleteRecord(): Promise<void> {}
  protected async _getRecord(idempotencyKey: string): Promise<IdempotencyRecord> {
    const ddbDocClient: DynamoDBDocument = DynamoDBDocument.from(new DynamoDB({}));
    const output: GetCommandOutput = await ddbDocClient.get(
      { TableName: this.tableName, Key: { [this.key_attr]: idempotencyKey } 
      }
    );

    return new IdempotencyRecord(output.Item?.[this.key_attr], output.Item?.[this.status_attr], output.Item?.[this.expiry_attr], output.Item?.[this.in_progress_expiry_attr], output.Item?.[this.data_attr], undefined);
  }
  protected async _putRecord(_record: IdempotencyRecord): Promise<void> {}
  protected async _updateRecord(): Promise<void> {}
}

export {
  DynamoDBPersistenceLayer
};