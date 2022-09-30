/* eslint-disable @typescript-eslint/no-empty-function */
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { IdempotencyItemNotFoundError } from '../Exceptions';
import { IdempotencyRecordStatus } from '../types/IdempotencyRecordStatus';
import { IdempotencyRecord, PersistenceLayer } from './PersistenceLayer';

class DynamoDBPersistenceLayer extends PersistenceLayer {
  private _table: DynamoDBDocument | undefined;

  public constructor(private tableName: string, private key_attr: string = 'id',
    private status_attr: string = 'status', private expiry_attr: string = 'expiration',
    private in_progress_expiry_attr: string = 'in_progress_expiry_attr',
    private data_attr: string = 'data') {
    super();
  }

  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
    const table: DynamoDBDocument = this.getTable();
    await table.delete({
      TableName: this.tableName, Key: { [this.key_attr]: record.idempotencyKey }
    });
  }

  protected async _getRecord(idempotencyKey: string): Promise<IdempotencyRecord> {
    const table: DynamoDBDocument = this.getTable();
    const output: GetCommandOutput = await table.get(
      {
        TableName: this.tableName, Key: { [this.key_attr]: idempotencyKey }
      }
    );

    if (!output.Item) {
      throw new IdempotencyItemNotFoundError();
    }

    return new IdempotencyRecord(output.Item[this.key_attr], output.Item[this.status_attr], output.Item[this.expiry_attr], output.Item[this.in_progress_expiry_attr], output.Item[this.data_attr], undefined);
  }

  protected async _putRecord(_record: IdempotencyRecord): Promise<void> {
    const table: DynamoDBDocument = this.getTable();

    const item = { [this.key_attr]: _record.idempotencyKey, [this.expiry_attr]: _record.expiryTimestamp, [this.status_attr]: _record.getStatus() };

    const idempotencyKeyDoesNotExist = 'attribute_not_exists(#id)';
    const idempotencyKeyExpired = '#expiry < :now';
    const notInProgress = 'NOT #status = :inprogress';
    const conditionalExpression = `${idempotencyKeyDoesNotExist} OR ${idempotencyKeyExpired} OR ${notInProgress}`;
    await table.put({ TableName: this.tableName, Item: item, ExpressionAttributeNames: { '#id': this.key_attr, '#expiry': this.expiry_attr, '#status': this.status_attr }, ExpressionAttributeValues: { ':now': Date.now(), ':inprogress': IdempotencyRecordStatus.INPROGRESS }, ConditionExpression: conditionalExpression });
  }

  protected async _updateRecord(record: IdempotencyRecord): Promise<void> {
    const table: DynamoDBDocument = this.getTable();
    await table.update(
      {
        TableName: this.tableName, Key: { [this.key_attr]: record.idempotencyKey },
        UpdateExpression: 'SET #status = :status, #expiry = :expiry', ExpressionAttributeNames: { '#status': this.status_attr, '#expiry': this.expiry_attr }, ExpressionAttributeValues: { ':status': record.getStatus(), ':expiry': record.expiryTimestamp }
      }
    );
  }

  private getTable(): DynamoDBDocument {
    if (!this._table)
      this._table = DynamoDBDocument.from(new DynamoDB({}));

    return this._table;
  }
}

export {
  DynamoDBPersistenceLayer
};

