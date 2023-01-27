import { DynamoDB, DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import type { GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoPersistenceConstructorOptions } from '../types/DynamoPersistenceConstructorOptions';
import { IdempotencyItemAlreadyExistsError, IdempotencyItemNotFoundError } from '../Exceptions';
import { IdempotencyRecordStatus } from '../types/IdempotencyRecordStatus';
import { IdempotencyRecord } from './IdempotencyRecord';
import { PersistenceLayer } from './PersistenceLayer';

class DynamoDBPersistenceLayer extends PersistenceLayer {
  private dataAttr: string;
  private expiryAttr: string;
  private inProgressExpiryAttr: string;
  private keyAttr: string;
  private statusAttr: string;
  private table: DynamoDBDocument | undefined;
  private tableName: string;

  public constructor(constructorOptions: DynamoPersistenceConstructorOptions) {
    super();

    this.tableName = constructorOptions.tableName;
    this.keyAttr = constructorOptions.keyAttr ?? 'id';
    this.statusAttr = constructorOptions.statusAttr ?? 'status';
    this.expiryAttr = constructorOptions.expiryAttr ?? 'expiration';
    this.inProgressExpiryAttr = constructorOptions.inProgressExpiryAttr ?? 'in_progress_expiry_attr';
    this.dataAttr = constructorOptions.dataAttr ?? 'data';
  }

  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
    const table: DynamoDBDocument = this.getTable();
    await table.delete({
      TableName: this.tableName, Key: { [this.keyAttr]: record.idempotencyKey }
    });
  }

  protected async _getRecord(idempotencyKey: string): Promise<IdempotencyRecord> {
    const table: DynamoDBDocument = this.getTable();
    const output: GetCommandOutput = await table.get(
      {
        TableName: this.tableName, Key: { 
          [this.keyAttr]: idempotencyKey 
        },
        ConsistentRead: true
      }
    );

    if (!output.Item) {
      throw new IdempotencyItemNotFoundError();
    }

    return new IdempotencyRecord({
      idempotencyKey: output.Item[this.keyAttr], 
      status: output.Item[this.statusAttr], 
      expiryTimestamp: output.Item[this.expiryAttr], 
      inProgressExpiryTimestamp: output.Item[this.inProgressExpiryAttr], 
      responseData: output.Item[this.dataAttr]
    });
  }

  protected async _putRecord(_record: IdempotencyRecord): Promise<void> {
    const table: DynamoDBDocument = this.getTable();

    const item = { 
      [this.keyAttr]: _record.idempotencyKey, 
      [this.expiryAttr]: _record.expiryTimestamp, 
      [this.statusAttr]: _record.getStatus()
    };

    const idempotencyKeyDoesNotExist = 'attribute_not_exists(#id)';
    const idempotencyKeyExpired = '#expiry < :now';
    const notInProgress = 'NOT #status = :inprogress';
    const conditionalExpression = `${idempotencyKeyDoesNotExist} OR ${idempotencyKeyExpired} OR ${notInProgress}`;
    try {
      await table.put({ 
        TableName: this.tableName, 
        Item: item, 
        ExpressionAttributeNames: { 
          '#id': this.keyAttr, 
          '#expiry': this.expiryAttr, 
          '#status': this.statusAttr 
        }, 
        ExpressionAttributeValues: {
          ':now': Date.now() / 1000, 
          ':inprogress': IdempotencyRecordStatus.INPROGRESS 
        }, 
        ConditionExpression: conditionalExpression 
      }
      );
    } catch (e){
      if ((e as DynamoDBServiceException).name === 'ConditionalCheckFailedException'){
        throw new IdempotencyItemAlreadyExistsError();
      }

      throw e;
    }
  }

  protected async _updateRecord(record: IdempotencyRecord): Promise<void> {
    const table: DynamoDBDocument = this.getTable();
    await table.update(
      {
        TableName: this.tableName, 
        Key: { 
          [this.keyAttr]: record.idempotencyKey 
        },
        UpdateExpression: 'SET #status = :status, #expiry = :expiry', 
        ExpressionAttributeNames: { 
          '#status': this.statusAttr, 
          '#expiry': this.expiryAttr 
        }, 
        ExpressionAttributeValues: { 
          ':status': record.getStatus(), 
          ':expiry': record.expiryTimestamp 
        }
      }
    );
  }

  private getTable(): DynamoDBDocument {
    if (!this.table)
      this.table = DynamoDBDocument.from(new DynamoDB({}), { marshallOptions: { removeUndefinedValues: true } });

    return this.table;
  }
}

export {
  DynamoDBPersistenceLayer
};

