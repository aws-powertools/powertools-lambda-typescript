import { DynamoDB, DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { IdempotencyItemAlreadyExistsError } from '../../../src/Exceptions';
import { DynamoDBPersistenceLayer } from '../../../src/persistence/DynamoDbPersistenceLayer';
import { IdempotencyRecord } from '../../../src/persistence/IdempotencyRecord';
import { IdempotencyRecordStatus } from '../../../src/types/IdempotencyRecordStatus';

/**
 * Test Dynamo Persistence layer
 *
 * @group unit/idempotency/all
 */

describe('Given a idempotency key', () => {
  ///add test
});

describe('Class: DynamoDbPersistenceLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Method: _putRecord', () => {
    test('when called with a record that succeeds condition, it puts record in dynamo table', () => {
      class TestDynamoPersistenceLayer extends DynamoDBPersistenceLayer {
        public _putRecord(_record: IdempotencyRecord): Promise<void> {
          return super._putRecord(_record);
        }
      }

      // Prepare
      const tableName = 'tableName';
      const persistenceLayer = new TestDynamoPersistenceLayer(tableName);

      const key = 'key';
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = 0;
      const inProgressExpiryTimestamp = 0;
      const record = new IdempotencyRecord(key, status, expiryTimestamp, inProgressExpiryTimestamp, undefined, undefined);

      const currentDate = 1;
      jest.spyOn(Date, 'now').mockReturnValue(currentDate);

      const dynamoClient = mockClient(DynamoDBDocument).on(PutCommand).resolves({});

      // Act
      persistenceLayer._putRecord(record);

      // Assess
      expect(dynamoClient).toReceiveCommandWith(PutCommand, {
        TableName: tableName,
        Item: { 'id': key, 'expiration': expiryTimestamp, status: status },
        ExpressionAttributeNames: { '#id': 'id', '#expiry': 'expiration', '#status': 'status' },
        ExpressionAttributeValues: { ':now': currentDate, ':inprogress': IdempotencyRecordStatus.INPROGRESS },
        ConditionExpression: 'attribute_not_exists(#id) OR #expiry < :now OR NOT #status = :inprogress'
      });
    });
  });
});