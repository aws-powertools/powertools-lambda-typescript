import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
} from '../Exceptions';
import { IdempotencyRecordStatus } from '../types';
import type { DynamoPersistenceOptions } from '../types';
import {
  DynamoDBClient,
  DynamoDBClientConfig,
  DynamoDBServiceException,
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { IdempotencyRecord } from './IdempotencyRecord';
import { BasePersistenceLayer } from './BasePersistenceLayer';

class DynamoDBPersistenceLayer extends BasePersistenceLayer {
  private client?: DynamoDBClient;
  private clientConfig: DynamoDBClientConfig = {};
  private dataAttr: string;
  private expiryAttr: string;
  private inProgressExpiryAttr: string;
  private keyAttr: string;
  private sortKeyAttr?: string;
  private staticPkValue: string;
  private statusAttr: string;
  private tableName: string;
  private validationKeyAttr: string;

  public constructor(config: DynamoPersistenceOptions) {
    super();

    this.tableName = config.tableName;
    this.keyAttr = config.keyAttr ?? 'id';
    this.statusAttr = config.statusAttr ?? 'status';
    this.expiryAttr = config.expiryAttr ?? 'expiration';
    this.inProgressExpiryAttr =
      config.inProgressExpiryAttr ?? 'in_progress_expiry_attr';
    this.dataAttr = config.dataAttr ?? 'data';
    this.validationKeyAttr = config.validationKeyAttr ?? 'validation';
    if (config.sortKeyAttr === this.keyAttr) {
      throw new Error(
        `keyAttr [${this.keyAttr}] and sortKeyAttr [${config.sortKeyAttr}] cannot be the same!`
      );
    }
    this.sortKeyAttr = config.sortKeyAttr;
    this.staticPkValue =
      config.staticPkValue ?? `idempotency#${this.idempotencyKeyPrefix}`;

    if (config?.awsSdkV3Client) {
      if (config?.awsSdkV3Client instanceof DynamoDBClient) {
        this.client = config.awsSdkV3Client;
      } else {
        console.warn(
          'Invalid AWS SDK V3 client passed to DynamoDBPersistenceLayer. Using default client.'
        );
      }
    } else {
      this.clientConfig = config?.clientConfig ?? {};
    }
  }

  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
    const client = this.getClient();
    await client.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: this.getKey(record.idempotencyKey),
      })
    );
  }

  protected async _getRecord(
    idempotencyKey: string
  ): Promise<IdempotencyRecord> {
    const client = this.getClient();
    const result = await client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: this.getKey(idempotencyKey),
        ConsistentRead: true,
      })
    );

    if (!result.Item) {
      throw new IdempotencyItemNotFoundError();
    }
    const item = unmarshall(result.Item);

    return new IdempotencyRecord({
      idempotencyKey: item[this.keyAttr],
      status: item[this.statusAttr],
      expiryTimestamp: item[this.expiryAttr],
      inProgressExpiryTimestamp: item[this.inProgressExpiryAttr],
      responseData: item[this.dataAttr],
    });
  }

  protected async _putRecord(record: IdempotencyRecord): Promise<void> {
    const client = this.getClient();

    const item = {
      ...this.getKey(record.idempotencyKey),
      ...marshall({
        [this.expiryAttr]: record.expiryTimestamp,
        [this.statusAttr]: record.getStatus(),
      }),
    };

    if (record.inProgressExpiryTimestamp !== undefined) {
      item[this.inProgressExpiryAttr] = {
        N: record.inProgressExpiryTimestamp.toString(),
      };
    }

    if (this.isPayloadValidationEnabled() && record.payloadHash !== undefined) {
      item[this.validationKeyAttr] = {
        S: record.payloadHash as string,
      };
    }

    try {
      /**
       * |     LOCKED     |         RETRY if status = "INPROGRESS"                |     RETRY
       * |----------------|-------------------------------------------------------|-------------> .... (time)
       * |             Lambda                                              Idempotency Record
       * |             Timeout                                                 Timeout
       * |       (in_progress_expiry)                                          (expiry)
       *
       * Conditions to successfully save a record:
       * * The idempotency key does not exist:
       *   - first time that this invocation key is used
       *   - previous invocation with the same key was deleted due to TTL
       */
      const idempotencyKeyDoesNotExist = 'attribute_not_exists(#id)';
      // * The idempotency key exists but it is expired
      const idempotencyKeyExpired = '#expiry < :now';
      // * The status of the record is "INPROGRESS", there is an in-progress expiry timestamp, but it's expired
      const inProgressExpiryExpired = [
        '#status = :inprogress',
        'attribute_exists(#in_progress_expiry)',
        '#in_progress_expiry < :now_in_millis',
      ].join(' AND ');

      const conditionExpression = [
        idempotencyKeyDoesNotExist,
        idempotencyKeyExpired,
        `(${inProgressExpiryExpired})`,
      ].join(' OR ');

      const now = Date.now();
      await client.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: item,
          ExpressionAttributeNames: {
            '#id': this.keyAttr,
            '#expiry': this.expiryAttr,
            '#in_progress_expiry': this.inProgressExpiryAttr,
            '#status': this.statusAttr,
          },
          ExpressionAttributeValues: marshall({
            ':now': now / 1000,
            ':now_in_millis': now,
            ':inprogress': IdempotencyRecordStatus.INPROGRESS,
          }),
          ConditionExpression: conditionExpression,
        })
      );
    } catch (error) {
      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ConditionalCheckFailedException') {
          throw new IdempotencyItemAlreadyExistsError(
            `Failed to put record for already existing idempotency key: ${record.idempotencyKey}`
          );
        }
      }

      throw error;
    }
  }

  protected async _updateRecord(record: IdempotencyRecord): Promise<void> {
    const client = this.getClient();

    const updateExpressionFields: string[] = [
      '#response_data = :response_data',
      '#expiry = :expiry',
      '#status = :status',
    ];
    const expressionAttributeNames: Record<string, string> = {
      '#response_data': this.dataAttr,
      '#expiry': this.expiryAttr,
      '#status': this.statusAttr,
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ':response_data': record.responseData,
      ':expiry': record.expiryTimestamp,
      ':status': record.getStatus(),
    };

    if (this.isPayloadValidationEnabled()) {
      updateExpressionFields.push('#validation_key = :validation_key');
      expressionAttributeNames['#validation_key'] = this.validationKeyAttr;
      expressionAttributeValues[':validation_key'] = record.payloadHash;
    }

    await client.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: this.getKey(record.idempotencyKey),
        UpdateExpression: `SET ${updateExpressionFields.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
      })
    );
  }

  private getClient(): DynamoDBClient {
    if (!this.client) {
      this.client = new DynamoDBClient(this.clientConfig);
    }

    return this.client;
  }

  /**
   * Build primary key attribute simple or composite based on params.
   *
   * When sortKeyAttr is set, we must return a composite key with staticPkValue,
   * otherwise we use the idempotency key given.
   *
   * @param idempotencyKey
   */
  private getKey(idempotencyKey: string): Record<string, AttributeValue> {
    if (this.sortKeyAttr) {
      return marshall({
        [this.keyAttr]: this.staticPkValue,
        [this.sortKeyAttr]: idempotencyKey,
      });
    }

    return marshall({
      [this.keyAttr]: idempotencyKey,
    });
  }
}

export { DynamoDBPersistenceLayer };
