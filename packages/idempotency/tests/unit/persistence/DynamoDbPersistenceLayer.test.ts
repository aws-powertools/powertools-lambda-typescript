import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import {
  ConditionalCheckFailedException,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
  IdempotencyRecordStatus,
} from '../../../src/index.js';
import { IdempotencyRecord } from '../../../src/persistence/index.js';
import type { DynamoDBPersistenceOptions } from '../../../src/types/DynamoDBPersistence.js';
import { DynamoDBPersistenceLayerTestClass } from '../../helpers/idempotencyUtils.js';

const getFutureTimestamp = (seconds: number): number =>
  new Date().getTime() + seconds * 1000;

vi.mock('@aws-lambda-powertools/commons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-lambda-powertools/commons')>()),
  addUserAgentMiddleware: vi.fn(),
}));

const dummyTableName = 'someTable';
const dummyKey = 'someKey';
const persistenceLayer = new DynamoDBPersistenceLayerTestClass({
  tableName: dummyTableName,
});

describe('Class: DynamoDBPersistenceLayer', () => {
  const client = mockClient(DynamoDBClient);

  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date());
  });

  afterEach(() => {
    vi.clearAllMocks();
    client.reset();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('Method: constructor', () => {
    it('creates an instance with default values', () => {
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

    it('creates an instance with the provided values', () => {
      // Prepare
      const DynamoDBPersistenceLayerTestClassOptions: DynamoDBPersistenceOptions =
        {
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
      const persistenceLayer = new DynamoDBPersistenceLayerTestClass(
        DynamoDBPersistenceLayerTestClassOptions
      );

      // Assess
      expect(persistenceLayer).toEqual(
        expect.objectContaining({
          tableName: dummyTableName,
          keyAttr: dummyKey,
          statusAttr: DynamoDBPersistenceLayerTestClassOptions.statusAttr,
          expiryAttr: DynamoDBPersistenceLayerTestClassOptions.expiryAttr,
          inProgressExpiryAttr:
            DynamoDBPersistenceLayerTestClassOptions.inProgressExpiryAttr,
          dataAttr: DynamoDBPersistenceLayerTestClassOptions.dataAttr,
          validationKeyAttr:
            DynamoDBPersistenceLayerTestClassOptions.validationKeyAttr,
          staticPkValue: DynamoDBPersistenceLayerTestClassOptions.staticPkValue,
          sortKeyAttr: DynamoDBPersistenceLayerTestClassOptions.sortKeyAttr,
        })
      );
    });

    it('throws when sortKeyAttr and keyAttr have the same value', () => {
      // Act & Assess
      expect(
        () =>
          new DynamoDBPersistenceLayerTestClass({
            tableName: dummyTableName,
            keyAttr: dummyKey,
            sortKeyAttr: dummyKey,
          })
      ).toThrowError(
        `keyAttr [${dummyKey}] and sortKeyAttr [${dummyKey}] cannot be the same!`
      );
    });

    it('uses the AWS SDK client provided and appends the UA middleware', () => {
      // Prepare
      const awsSdkV3Client = new DynamoDBClient({});

      // Act
      const persistenceLayer = new DynamoDBPersistenceLayerTestClass({
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
      // Act
      const persistenceLayer = new DynamoDBPersistenceLayerTestClass({
        tableName: dummyTableName,
        awsSdkV3Client: {} as DynamoDBClient,
      });

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
      expect(console.warn).toHaveBeenNthCalledWith(
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
    it('puts the record in DynamoDB', async () => {
      // Prepare
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

    it('puts the record in DynamoDB when using the provided composite key', async () => {
      // Prepare
      const persistenceLayer = new DynamoDBPersistenceLayerTestClass({
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

    it('puts the record in DynamoDB when using an in progress expiry timestamp', async () => {
      // Prepare
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

    it('puts record in DynamoDB table when using payload validation', async () => {
      // Prepare
      const persistenceLayerSpy = vi
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
      persistenceLayerSpy.mockRestore();
    });

    it('throws when called with a record that fails any condition', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.EXPIRED,
        expiryTimestamp: 0,
      });
      const expiration = Date.now();
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
            expiration: { N: expiration.toString() },
          },
        })
      );

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrowError(
        new IdempotencyItemAlreadyExistsError(
          `Failed to put record for already existing idempotency key: ${record.idempotencyKey}`,
          new IdempotencyRecord({
            idempotencyKey: 'test-key',
            status: IdempotencyRecordStatus.INPROGRESS,
            expiryTimestamp: expiration,
          })
        )
      );
    });

    it('throws when encountering an unknown error', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.EXPIRED,
        expiryTimestamp: 0,
        inProgressExpiryTimestamp: 0,
      });
      client.on(PutItemCommand).rejects(new Error());

      // Act & Assess
      await expect(persistenceLayer._putRecord(record)).rejects.toThrow();
    });
  });

  describe('Method: _getRecord', () => {
    it('gets the record from DynamoDB', async () => {
      // Prepare
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
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: dummyTableName,
        Key: marshall({
          id: dummyKey,
        }),
        ConsistentRead: true,
      });
      expect(record).toBeInstanceOf(IdempotencyRecord);
      expect(record.getStatus()).toEqual(IdempotencyRecordStatus.INPROGRESS);
      expect(record.idempotencyKey).toEqual(dummyKey);
      expect(record.inProgressExpiryTimestamp).toEqual(
        inProgressExpiryTimestamp
      );
      expect(record.responseData).toEqual(responseData);
      expect(record.expiryTimestamp).toEqual(expiryTimestamp);
    });

    it('throws when the record does not exist', async () => {
      // Prepare
      client.on(GetItemCommand).resolves({ Item: undefined });

      // Act & Assess
      await expect(persistenceLayer._getRecord(dummyKey)).rejects.toThrowError(
        IdempotencyItemNotFoundError
      );
    });

    it('it builds the request correctly when using composite keys', async () => {
      // Prepare
      const persistenceLayer = new DynamoDBPersistenceLayerTestClass({
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

    it('gets the record and validates the hash correctly', async () => {
      // Prepare
      const persistenceLayer = new DynamoDBPersistenceLayerTestClass({
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
    it('it updates the item with the correct parameters', async () => {
      // Prepare
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
          'SET #expiry = :expiry, #status = :status, #response_data = :response_data',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#expiry': 'expiration',
          '#response_data': 'data',
        },
        ExpressionAttributeValues: marshall({
          ':status': status,
          ':expiry': expiryTimestamp,
          ':response_data': {},
        }),
      });
    });

    it('updates the item when the response_data is undefined', async () => {
      // Prepare
      const status = IdempotencyRecordStatus.EXPIRED;
      const expiryTimestamp = Date.now();
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status,
        expiryTimestamp,
        responseData: undefined,
      });

      // Act
      persistenceLayer._updateRecord(record);

      // Assess
      expect(client).toReceiveCommandWith(UpdateItemCommand, {
        TableName: dummyTableName,
        Key: marshall({
          id: dummyKey,
        }),
        UpdateExpression: 'SET #expiry = :expiry, #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#expiry': 'expiration',
        },
        ExpressionAttributeValues: marshall({
          ':status': status,
          ':expiry': expiryTimestamp,
        }),
      });
    });

    it('uses the payload hash in the expression when payload validation is enabled', async () => {
      // Prepare
      const persistenceLayerSpy = vi
        .spyOn(persistenceLayer, 'isPayloadValidationEnabled')
        .mockImplementation(() => true);
      const expiryTimestamp = Date.now();
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.EXPIRED,
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
          'SET #expiry = :expiry, #status = :status, #response_data = :response_data, #validation_key = :validation_key',
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
      persistenceLayerSpy.mockRestore();
    });
  });

  describe('Method: _deleteRecord', () => {
    it('deletes the record using the correct parameters', async () => {
      // Prepare
      const record = new IdempotencyRecord({
        idempotencyKey: dummyKey,
        status: IdempotencyRecordStatus.EXPIRED,
        expiryTimestamp: Date.now(),
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
});
