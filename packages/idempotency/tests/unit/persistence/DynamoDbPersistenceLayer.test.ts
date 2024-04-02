/**
 * Test DynamoDBPersistenceLayer class
 *
 * @group unit/idempotency/persistence/dynamodb
 */
import { DynamoDBPersistenceLayer } from '../../../src/persistence/DynamoDBPersistenceLayer.js';
import { IdempotencyRecord } from '../../../src/persistence/index.js';
import type { DynamoDBPersistenceOptions } from '../../../src/types/DynamoDBPersistence.js';
import {
  IdempotencyRecordStatus,
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
} from '../../../src/index.js';
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import 'aws-sdk-client-mock-jest';

const getFutureTimestamp = (seconds: number): number =>
  new Date().getTime() + seconds * 1000;

jest.mock('@aws-lambda-powertools/commons', () => ({
  ...jest.requireActual('@aws-lambda-powertools/commons'),
  addUserAgentMiddleware: jest.fn(),
}));

describe('Class: DynamoDBPersistenceLayer', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const client = mockClient(DynamoDBClient);
  const dummyTableName = 'someTable';
  const dummyKey = 'someKey';

  class TestDynamoDBPersistenceLayer extends DynamoDBPersistenceLayer {
    public _deleteRecord(record: IdempotencyRecord): Promise<void> {
      return super._deleteRecord(record);
    }

    public _getRecord(idempotencyKey: string): Promise<IdempotencyRecord> {
      return super._getRecord(idempotencyKey);
    }

    public _putRecord(_record: IdempotencyRecord): Promise<void> {
      return super._putRecord(_record);
    }

    public _updateRecord(record: IdempotencyRecord): Promise<void> {
      return super._updateRecord(record);
    }
  }

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterEach(() => {
    client.reset();
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
    jest.useRealTimers();
  });

  describe('Method: constructor', () => {
    test('when instantiated with minimum options it creates an instance with default values', () => {
      // Prepare & Act
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });

      // Assess
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          tableName: dummyTableName,
          keyAttr: 'id',
          statusAttr: 'status',
          expiryAttr: 'expiration',
          inProgressExpiryAttr: 'in_progress_expiration',
          dataAttr: 'data',
          validationKeyAttr: 'validation',
          staticPkValue: 'idempotency#my-lambda-function',
        })
      );
    });

    test('when instantiated with specific options it creates an instance with correct values', () => {
      // Prepare
      const testDynamoDBPersistenceLayerOptions: DynamoDBPersistenceOptions = {
        tableName: dummyTableName,
        keyAttr: dummyKey,
        statusAttr: 'someStatusAttr',
        expiryAttr: 'someExpiryAttr',
        inProgressExpiryAttr: 'someInProgressExpiryAttr',
        dataAttr: 'someDataAttr',
        validationKeyAttr: 'someValidationKeyAttr',
        staticPkValue: 'someStaticPkValue',
        sortKeyAttr: 'someSortKeyAttr',
      };

      // Act
      const persistenceLayer = new TestDynamoDBPersistenceLayer(
        testDynamoDBPersistenceLayerOptions
      );

      // Assess
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          tableName: dummyTableName,
          keyAttr: dummyKey,
          statusAttr: testDynamoDBPersistenceLayerOptions.statusAttr,
          expiryAttr: testDynamoDBPersistenceLayerOptions.expiryAttr,
          inProgressExpiryAttr:
            testDynamoDBPersistenceLayerOptions.inProgressExpiryAttr,
          dataAttr: testDynamoDBPersistenceLayerOptions.dataAttr,
          validationKeyAttr:
            testDynamoDBPersistenceLayerOptions.validationKeyAttr,
          staticPkValue: testDynamoDBPersistenceLayerOptions.staticPkValue,
          sortKeyAttr: testDynamoDBPersistenceLayerOptions.sortKeyAttr,
        })
      );
    });

    test('when instantiated with a sortKeyAttr that has same value of keyAttr, it throws', () => {
      // Prepare
      const testDynamoDBPersistenceLayerOptions: DynamoDBPersistenceOptions = {
        tableName: dummyTableName,
        keyAttr: dummyKey,
        sortKeyAttr: dummyKey,
      };

      // Act & Assess
      expect(
        () =>
          new TestDynamoDBPersistenceLayer(testDynamoDBPersistenceLayerOptions)
      ).toThrowError(
        `keyAttr [${dummyKey}] and sortKeyAttr [${dummyKey}] cannot be the same!`
      );
    });

    test('when instantiated with a custom AWS SDK client it uses that client', () => {
      // Prepare
      const awsSdkV3Client = new DynamoDBClient({});

      // Act
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
        awsSdkV3Client,
      });

      // Assess
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          tableName: dummyTableName,
          client: awsSdkV3Client,
        })
      );
      expect(addUserAgentMiddleware).toHaveBeenCalledWith(
        awsSdkV3Client,
        'idempotency'
      );
    });

    it('falls back on a new SDK client and logs a warning when an unknown object is provided instead of a client', async () => {
      // Prepare
      const awsSdkV3Client = {};
      const options: DynamoDBPersistenceOptions = {
        tableName: dummyTableName,
        awsSdkV3Client: awsSdkV3Client as DynamoDBClient,
      };
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const persistenceLayer = new TestDynamoDBPersistenceLayer(options);

      // Assess
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          tableName: dummyTableName,
          client: expect.objectContaining({
            config: expect.objectContaining({
              serviceId: 'DynamoDB',
            }),
          }),
        })
      );
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        1,
        'awsSdkV3Client is not an AWS SDK v3 client, using default client'
      );
      expect(addUserAgentMiddleware).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            serviceId: 'DynamoDB',
          }),
        }),
        'idempotency'
      );
    });
  });

  describe('Method: _putRecord', () => {
    test('when called with a record that meets conditions, it puts record in DynamoDB table', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = 0;
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client).toReceiveCommandWith(PutItemCommand, {
        TableName: dummyTableName,
        Item: marshall({
          id: dummyKey,
          expiration: expiryTimestamp,
          status,
        }),
        ExpressionAttributeNames: {
          '#id': 'id',
          '#expiry': 'expiration',
          '#status': 'status',
          '#in_progress_expiry': 'in_progress_expiration',
        },
        ExpressionAttributeValues: marshall({
          ':now': Date.now() / 1000,
          ':now_in_millis': Date.now(),
          ':inprogress': IdempotencyRecordStatus.INPROGRESS,
        }),
        ConditionExpression:
          'attribute_not_exists(#id) OR #expiry < :now OR (#status = :inprogress AND attribute_exists(#in_progress_expiry) AND #in_progress_expiry < :now_in_millis)',
      });
    });

    test('when called with a record that uses composite key, it puts record in DynamoDB table', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
        staticPkValue: 'idempotency#my-lambda-function',
        sortKeyAttr: 'sortKey',
      });
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = 0;
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client).toReceiveCommandWith(PutItemCommand, {
        TableName: dummyTableName,
        Item: marshall({
          id: 'idempotency#my-lambda-function',
          sortKey: dummyKey,
          expiration: expiryTimestamp,
          status,
        }),
        ExpressionAttributeNames: {
          '#id': 'id',
          '#expiry': 'expiration',
          '#status': 'status',
          '#in_progress_expiry': 'in_progress_expiration',
        },
        ExpressionAttributeValues: marshall({
          ':now': Date.now() / 1000,
          ':now_in_millis': Date.now(),
          ':inprogress': IdempotencyRecordStatus.INPROGRESS,
        }),
        ConditionExpression:
          'attribute_not_exists(#id) OR #expiry < :now OR (#status = :inprogress AND attribute_exists(#in_progress_expiry) AND #in_progress_expiry < :now_in_millis)',
      });
    });

    test('when called with a record that has inProgressExpiryTimestamp, it puts record in DynamoDB table', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      const status = IdempotencyRecordStatus.INPROGRESS;
      const expiryTimestamp = getFutureTimestamp(10);
      const inProgressExpiryTimestamp = getFutureTimestamp(5);
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
        inProgressExpiryTimestamp,
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client).toReceiveCommandWith(PutItemCommand, {
        TableName: dummyTableName,
        Item: marshall({
          id: dummyKey,
          expiration: expiryTimestamp,
          status,
          in_progress_expiration: inProgressExpiryTimestamp,
        }),
        ExpressionAttributeNames: {
          '#id': 'id',
          '#expiry': 'expiration',
          '#status': 'status',
          '#in_progress_expiry': 'in_progress_expiration',
        },
        ExpressionAttributeValues: marshall({
          ':now': Date.now() / 1000,
          ':now_in_millis': Date.now(),
          ':inprogress': IdempotencyRecordStatus.INPROGRESS,
        }),
        ConditionExpression:
          'attribute_not_exists(#id) OR #expiry < :now OR (#status = :inprogress AND attribute_exists(#in_progress_expiry) AND #in_progress_expiry < :now_in_millis)',
      });
    });

    test('when called and and payload validation is enabled it puts record in DynamoDB table', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      jest
        .spyOn(persistenceLayer, 'isPayloadValidationEnabled')
        .mockReturnValue(true);
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = 0;
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
        payloadHash: 'someHash',
      });

      // Act
      await persistenceLayer._putRecord(record);

      // Assess
      expect(client).toReceiveCommandWith(PutItemCommand, {
        TableName: dummyTableName,
        Item: marshall({
          id: dummyKey,
          expiration: expiryTimestamp,
          status,
          validation: record.payloadHash,
        }),
        ExpressionAttributeNames: {
          '#id': 'id',
          '#expiry': 'expiration',
          '#status': 'status',
          '#in_progress_expiry': 'in_progress_expiration',
        },
        ExpressionAttributeValues: marshall({
          ':now': Date.now() / 1000,
          ':now_in_millis': Date.now(),
          ':inprogress': IdempotencyRecordStatus.INPROGRESS,
        }),
        ConditionExpression:
          'attribute_not_exists(#id) OR #expiry < :now OR (#status = :inprogress AND attribute_exists(#in_progress_expiry) AND #in_progress_expiry < :now_in_millis)',
      });
    });

    test('when called with a record that fails any condition, it throws IdempotencyItemAlreadyExistsError', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });

      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.EXPIRED,
        expiryTimestamp: 0,
      });
      client.on(PutItemCommand).rejects(
        new ConditionalCheckFailedException({
          $metadata: {
            httpStatusCode: 400,
            requestId: 'someRequestId',
          },
          message: 'Conditional check failed',
          Item: {
            id: { S: 'test-key' },
            status: { S: 'INPROGRESS' },
            expiration: { N: Date.now().toString() },
          },
        })
      );

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrowError(
        new IdempotencyItemAlreadyExistsError(
          `Failed to put record for already existing idempotency key: ${record.idempotencyKey}`,
          new IdempotencyRecord({
            idempotencyKey: record.idempotencyKey,
            status: IdempotencyRecordStatus.EXPIRED,
            expiryTimestamp: Date.now() / 1000 - 1,
          })
        )
      );
    });

    test('when encountering an unknown error, it throws the causing error', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = 0;
      const inProgressExpiryTimestamp = 0;
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
        inProgressExpiryTimestamp,
      });
      client.on(PutItemCommand).rejects(new Error());

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrow();
    });
  });

  describe('Method: _getRecord', () => {
    test('it calls DynamoDB with correct parameters', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      client.on(GetItemCommand).resolves({
        Item: marshall({
          id: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiration: getFutureTimestamp(15),
          in_progress_expiration: getFutureTimestamp(10),
          data: {},
        }),
      });

      // Act
      await persistenceLayer._getRecord(dummyKey);

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: dummyTableName,
        Key: marshall({
          id: dummyKey,
        }),
        ConsistentRead: true,
      });
    });

    test('when called with a record whose key exists, it gets the correct record', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      const status = IdempotencyRecordStatus.INPROGRESS;
      const expiryTimestamp = getFutureTimestamp(15);
      const inProgressExpiryTimestamp = getFutureTimestamp(10);
      const responseData = {};
      client.on(GetItemCommand).resolves({
        Item: marshall({
          id: dummyKey,
          status,
          expiration: expiryTimestamp,
          in_progress_expiration: inProgressExpiryTimestamp,
          data: responseData,
        }),
      });

      // Act
      const record = await persistenceLayer._getRecord(dummyKey);

      // Assess
      expect(record).toBeInstanceOf(IdempotencyRecord);
      expect(record.getStatus()).toEqual(IdempotencyRecordStatus.INPROGRESS);
      expect(record.idempotencyKey).toEqual(dummyKey);
      expect(record.inProgressExpiryTimestamp).toEqual(
        inProgressExpiryTimestamp
      );
      expect(record.responseData).toEqual(responseData);
      expect(record.expiryTimestamp).toEqual(expiryTimestamp);
    });

    test('when called with a record whose key does not exist, it throws IdempotencyItemNotFoundError', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      client.on(GetItemCommand).resolves({ Item: undefined });

      // Act & Assess
      await expect(persistenceLayer._getRecord(dummyKey)).rejects.toThrowError(
        IdempotencyItemNotFoundError
      );
    });

    test('when called with a record in a table that use composite key, it builds the request correctly', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
        staticPkValue: 'idempotency#my-lambda-function',
        sortKeyAttr: 'sortKey',
      });
      client.on(GetItemCommand).resolves({
        Item: marshall({
          id: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiration: getFutureTimestamp(15),
          data: {},
        }),
      });

      // Act
      await persistenceLayer._getRecord(dummyKey);

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: dummyTableName,
        Key: marshall({
          id: 'idempotency#my-lambda-function',
          sortKey: dummyKey,
        }),
        ConsistentRead: true,
      });
    });

    test('when called with a record that had the ', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
        staticPkValue: 'idempotency#my-lambda-function',
        sortKeyAttr: 'sortKey',
      });
      client.on(GetItemCommand).resolves({
        Item: marshall({
          id: dummyKey,
          status: IdempotencyRecordStatus.INPROGRESS,
          expiration: getFutureTimestamp(15),
          in_progress_expiration: getFutureTimestamp(10),
          data: {},
          validation: 'someHash',
        }),
      });

      // Act
      const record = await persistenceLayer._getRecord(dummyKey);

      // Assess
      expect(record.idempotencyKey).toEqual(dummyKey);
      expect(record.getStatus()).toEqual(IdempotencyRecordStatus.INPROGRESS);
      expect(record.expiryTimestamp).toEqual(getFutureTimestamp(15));
      expect(record.inProgressExpiryTimestamp).toEqual(getFutureTimestamp(10));
      expect(record.responseData).toStrictEqual({});
      expect(record.payloadHash).toEqual('someHash');
    });
  });

  describe('Method: _updateRecord', () => {
    test('when called to update a record, it updates the item with the correct parameters', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = Date.now();
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
        responseData: {},
      });

      // Act
      await persistenceLayer._updateRecord(record);

      // Assess
      expect(client).toReceiveCommandWith(UpdateItemCommand, {
        TableName: dummyTableName,
        Key: marshall({
          id: dummyKey,
        }),
        UpdateExpression:
          'SET #response_data = :response_data, #expiry = :expiry, #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#expiry': 'expiration',
          '#response_data': 'data',
        },
        ExpressionAttributeValues: marshall({
          ':status': IdempotencyRecordStatus.EXPIRED,
          ':expiry': expiryTimestamp,
          ':response_data': {},
        }),
      });
    });

    test('when called to update a record and payload validation is enabled, it adds the payload hash to the update expression', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      jest
        .spyOn(persistenceLayer, 'isPayloadValidationEnabled')
        .mockImplementation(() => true);
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = Date.now();
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
        responseData: {},
        payloadHash: 'someHash',
      });

      // Act
      await persistenceLayer._updateRecord(record);

      // Assess
      expect(client).toReceiveCommandWith(UpdateItemCommand, {
        TableName: dummyTableName,
        Key: marshall({
          id: dummyKey,
        }),
        UpdateExpression:
          'SET #response_data = :response_data, #expiry = :expiry, #status = :status, #validation_key = :validation_key',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#expiry': 'expiration',
          '#response_data': 'data',
          '#validation_key': 'validation',
        },
        ExpressionAttributeValues: marshall({
          ':status': IdempotencyRecordStatus.EXPIRED,
          ':expiry': expiryTimestamp,
          ':response_data': {},
          ':validation_key': record.payloadHash,
        }),
      });
    });
  });

  describe('Method: _deleteRecord', () => {
    test('when called with a valid record, it calls the delete operation with the correct parameters', async () => {
      // Prepare
      const persistenceLayer = new TestDynamoDBPersistenceLayer({
        tableName: dummyTableName,
      });
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = Date.now();
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
      });

      // Act
      await persistenceLayer._deleteRecord(record);

      // Assess
      expect(client).toReceiveCommandWith(DeleteItemCommand, {
        TableName: dummyTableName,
        Key: marshall({ id: dummyKey }),
      });
    });
  });

  test('_putRecord throws Error when Item is undefined', async () => {
    // Prepare
    const persistenceLayer = new TestDynamoDBPersistenceLayer({
      tableName: dummyTableName,
    });
    const mockRecord = new IdempotencyRecord({
      idempotencyKey: 'test-key',
      status: 'INPROGRESS',
      expiryTimestamp: Date.now(),
    });

    DynamoDBClient.prototype.send = jest.fn().mockRejectedValueOnce(
      new ConditionalCheckFailedException({
        message: 'Conditional check failed',
        $metadata: {},
      })
    );
    await expect(
      persistenceLayer._putRecord(mockRecord)
    ).rejects.toThrowError();
  });
});
