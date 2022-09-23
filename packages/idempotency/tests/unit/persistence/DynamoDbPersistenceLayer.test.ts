import { DynamoDBDocument, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { IdempotencyItemNotFoundError } from '../../../src/Exceptions';
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

  describe('Method: _getRecord', () => {
    test('when called with a record whose key exists, it gets record', async () => {
      class TestDynamoPersistenceLayer extends DynamoDBPersistenceLayer {
        public _getRecord(idempotencyKey: string): Promise<IdempotencyRecord> {
          return super._getRecord(idempotencyKey);
        }
      }

      // Prepare
      const tableName = 'tableName';
      const persistenceLayer = new TestDynamoPersistenceLayer(tableName);

      const key = 'key';

      const status = IdempotencyRecordStatus.INPROGRESS;
      const expiryTimestamp = 10;
      const inProgressExpiryTimestamp = 10;
      const responseData = {};
      const dynamoClient = mockClient(DynamoDBDocument).on(GetCommand).resolves({ Item: { id: key, status, 'expiration': expiryTimestamp, 'in_progress_expiry_attr': inProgressExpiryTimestamp, data: responseData } });
      jest.spyOn(Date, 'now').mockReturnValue(0);

      // Act
      const record: IdempotencyRecord = await persistenceLayer._getRecord(key);

      // Assess
      expect(dynamoClient).toReceiveCommandWith(GetCommand, {
        TableName: tableName, Key: { id: key }
      });
      expect(record.getStatus()).toEqual(IdempotencyRecordStatus.INPROGRESS);
      expect(record.idempotencyKey).toEqual(key);
      expect(record.inProgressExpiryTimestamp).toEqual(inProgressExpiryTimestamp);
      expect(record.responseData).toEqual(responseData);
      expect(record.expiryTimestamp).toEqual(expiryTimestamp);
    });

    test('when called with a record whose key does not exist, it throws error', async () => {
      class TestDynamoPersistenceLayer extends DynamoDBPersistenceLayer {
        public _getRecord(idempotencyKey: string): Promise<IdempotencyRecord> {
          return super._getRecord(idempotencyKey);
        }
      }
  
      // Prepare
      const tableName = 'tableName';
      const persistenceLayer = new TestDynamoPersistenceLayer(tableName);
  
      const key = 'key';

      const dynamoClient = mockClient(DynamoDBDocument).on(GetCommand).resolves({ Item: undefined });
      jest.spyOn(Date, 'now').mockReturnValue(0);
  
      // Act
      let error: unknown;
      try {
        await persistenceLayer._getRecord(key);
      } catch (e){
        error = e;
      }
  
      // Assess
      expect(dynamoClient).toReceiveCommandWith(GetCommand, {
        TableName: tableName, Key: { id: key }
      });
      expect(error).toBeInstanceOf(IdempotencyItemNotFoundError);
    });
  });
});