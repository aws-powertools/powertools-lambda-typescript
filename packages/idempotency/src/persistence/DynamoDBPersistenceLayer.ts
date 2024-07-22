import {
  addUserAgentMiddleware,
  isSdkClient,
} from '@aws-lambda-powertools/commons';
import {
  type AttributeValue,
  ConditionalCheckFailedException,
  DeleteItemCommand,
  DynamoDBClient,
  type DynamoDBClientConfig,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { IdempotencyRecordStatus } from '../constants.js';
import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
} from '../errors.js';
import type { DynamoDBPersistenceOptions } from '../types/DynamoDBPersistence.js';
import { BasePersistenceLayer } from './BasePersistenceLayer.js';
import { IdempotencyRecord } from './IdempotencyRecord.js';

/**
 * DynamoDB persistence layer for idempotency records.
 *
 * This class uses the AWS SDK for JavaScript v3 to write and read idempotency records from DynamoDB.
 *
 * There are various options to configure the persistence layer, such as the table name, the key attribute, the status attribute, etc.
 *
 * With default configuration you don't need to create the client beforehand, the persistence layer will create it for you.
 * You can also bring your own AWS SDK V3 client, or configure the client with the `clientConfig` option.
 *
 * See the {@link https://docs.powertools.aws.dev/lambda/python/latest/utilities/idempotency/ Idempotency documentation} for more details
 * on the IAM permissions and DynamoDB table configuration.
 *
 * @example
 * ```ts
 * import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
 *
 * const persistence = new DynamoDBPersistenceLayer({
 *   tableName: 'my-idempotency-table',
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/index.html
 * @category Persistence Layer
 * @implements {BasePersistenceLayer}
 */
class DynamoDBPersistenceLayer extends BasePersistenceLayer {
  private client: DynamoDBClient;
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

  public constructor(config: DynamoDBPersistenceOptions) {
    super();

    this.tableName = config.tableName;
    this.keyAttr = config.keyAttr ?? 'id';
    this.statusAttr = config.statusAttr ?? 'status';
    this.expiryAttr = config.expiryAttr ?? 'expiration';
    this.inProgressExpiryAttr =
      config.inProgressExpiryAttr ?? 'in_progress_expiration';
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

    if (config.awsSdkV3Client) {
      if (!isSdkClient(config.awsSdkV3Client)) {
        console.warn(
          'awsSdkV3Client is not an AWS SDK v3 client, using default client'
        );
        this.client = new DynamoDBClient(config.clientConfig ?? {});
      } else {
        this.client = config.awsSdkV3Client;
      }
    } else {
      this.client = new DynamoDBClient(config.clientConfig ?? {});
    }
    addUserAgentMiddleware(this.client, 'idempotency');
  }

  protected async _deleteRecord(record: IdempotencyRecord): Promise<void> {
    await this.client.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: this.getKey(record.idempotencyKey),
      })
    );
  }

  protected async _getRecord(
    idempotencyKey: string
  ): Promise<IdempotencyRecord> {
    const result = await this.client.send(
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
      payloadHash: item[this.validationKeyAttr],
    });
  }

  protected async _putRecord(record: IdempotencyRecord): Promise<void> {
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
      await this.client.send(
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
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        })
      );
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        const item = error.Item && unmarshall(error.Item);
        const idempotencyRecord =
          item &&
          new IdempotencyRecord({
            idempotencyKey: item[this.keyAttr],
            status: item[this.statusAttr],
            expiryTimestamp: item[this.expiryAttr],
            inProgressExpiryTimestamp: item[this.inProgressExpiryAttr],
            responseData: item[this.dataAttr],
            payloadHash: item[this.validationKeyAttr],
          });
        throw new IdempotencyItemAlreadyExistsError(
          `Failed to put record for already existing idempotency key: ${record.idempotencyKey}`,
          idempotencyRecord
        );
      }

      throw error;
    }
  }

  protected async _updateRecord(record: IdempotencyRecord): Promise<void> {
    const updateExpressionFields: string[] = [
      '#expiry = :expiry',
      '#status = :status',
    ];
    const expressionAttributeNames: Record<string, string> = {
      '#expiry': this.expiryAttr,
      '#status': this.statusAttr,
    };
    const expressionAttributeValues: Record<string, unknown> = {
      ':expiry': record.expiryTimestamp,
      ':status': record.getStatus(),
    };

    if (record.responseData !== undefined) {
      updateExpressionFields.push('#response_data = :response_data');
      expressionAttributeNames['#response_data'] = this.dataAttr;
      expressionAttributeValues[':response_data'] = record.responseData;
    }

    if (this.isPayloadValidationEnabled()) {
      updateExpressionFields.push('#validation_key = :validation_key');
      expressionAttributeNames['#validation_key'] = this.validationKeyAttr;
      expressionAttributeValues[':validation_key'] = record.payloadHash;
    }

    await this.client.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: this.getKey(record.idempotencyKey),
        UpdateExpression: `SET ${updateExpressionFields.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
      })
    );
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
