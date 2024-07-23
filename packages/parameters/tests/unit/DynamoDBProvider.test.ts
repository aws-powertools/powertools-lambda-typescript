/**
 * Test DynamoDBProvider class
 *
 * @group unit/parameters/DynamoDBProvider/class
 */
import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import type {
  GetItemCommandInput,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBProvider } from '../../src/dynamodb/index.js';
import type { DynamoDBProviderOptions } from '../../src/types/DynamoDBProvider.js';
import 'aws-sdk-client-mock-jest';
jest.mock('@aws-lambda-powertools/commons', () => ({
  ...jest.requireActual('@aws-lambda-powertools/commons'),
  addUserAgentMiddleware: jest.fn(),
}));

describe('Class: DynamoDBProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Method: constructor', () => {
    test('when the class instantiates without SDK client and client config it has default options', async () => {
      // Prepare
      const options: DynamoDBProviderOptions = {
        tableName: 'test-table',
      };

      // Act
      const provider = new DynamoDBProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'DynamoDB',
        })
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    test('when the user provides a client config in the options, the class instantiates a new client with client config options', async () => {
      // Prepare
      const options: DynamoDBProviderOptions = {
        tableName: 'test-table',
        clientConfig: {
          region: 'eu-south-2',
        },
      };

      // Act
      const provider = new DynamoDBProvider(options);

      // Assess
      expect(provider.client.config.region()).resolves.toEqual('eu-south-2');
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    test('when the user provides an SDK client in the options, the class instantiates with it', async () => {
      // Prepare
      const awsSdkV3Client = new DynamoDBClient({
        endpoint: 'http://localhost:8000',
        serviceId: 'Foo',
      });

      const options: DynamoDBProviderOptions = {
        tableName: 'test-table',
        awsSdkV3Client: awsSdkV3Client,
      };

      // Act
      const provider = new DynamoDBProvider(options);

      // Assess
      expect(provider.client).toEqual(awsSdkV3Client);
      expect(addUserAgentMiddleware).toHaveBeenCalledWith(
        awsSdkV3Client,
        'parameters'
      );
    });

    it('falls back on a new SDK client and logs a warning when an unknown object is provided instead of a client', async () => {
      // Prepare
      const awsSdkV3Client = {};
      const options: DynamoDBProviderOptions = {
        tableName: 'test-table',
        awsSdkV3Client: awsSdkV3Client as DynamoDBClient,
      };
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const provider = new DynamoDBProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'DynamoDB',
        })
      );
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        1,
        'awsSdkV3Client is not an AWS SDK v3 client, using default client'
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });
  });

  describe('Method: _get', () => {
    test('when called and the sdk client returns no items, it returns undefined', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      mockClient(DynamoDBClient).on(GetItemCommand).resolves({});

      // Act
      const parameter = await provider.get(parameterPath);

      // Assess
      expect(parameter).toBeUndefined();
    });

    test('when called with only a name, it gets the parameter using the default attribute values and table name', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterName = 'foo';
      const parameterValue = 'bar';
      const client = mockClient(DynamoDBClient)
        .on(GetItemCommand)
        .resolves({
          Item: marshall({
            id: parameterName,
            value: parameterValue,
          }),
        });

      // Act
      const parameter = await provider.get(parameterName);

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          id: parameterName,
        }),
        ExpressionAttributeNames: {
          '#value': 'value',
        },
        ProjectionExpression: '#value',
      });
      expect(parameter).toEqual(parameterValue);
    });

    test('when called with only a name, it gets the parameter using the attribute values and table name provided to the constructor', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
        keyAttr: 'key',
        valueAttr: 'val',
      });
      const parameterName = 'foo';
      const parameterValue = 'bar';
      const client = mockClient(DynamoDBClient)
        .on(GetItemCommand)
        .resolves({
          Item: marshall({
            key: parameterName,
            val: parameterValue,
          }),
        });

      // Act
      const parameter = await provider.get(parameterName);

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          key: parameterName,
        }),
        ExpressionAttributeNames: {
          '#value': 'val',
        },
        ProjectionExpression: '#value',
      });
      expect(parameter).toEqual(parameterValue);
    });

    test('when called with name and sdkOptions, it gets the parameter using the options provided', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterName = 'foo';
      const parameterValue = 'bar';
      const client = mockClient(DynamoDBClient)
        .on(GetItemCommand)
        .resolves({
          Item: marshall({
            id: parameterName,
            value: parameterValue,
          }),
        });

      // Act
      const parameter = await provider.get(parameterName, {
        sdkOptions: {
          ConsistentRead: true,
        },
      });

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          id: parameterName,
        }),
        ExpressionAttributeNames: {
          '#value': 'value',
        },
        ProjectionExpression: '#value',
        ConsistentRead: true,
      });
      expect(parameter).toEqual(parameterValue);
    });

    test('when called with sdkOptions that override arguments passed to the method, it gets the parameter using the arguments', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterName = 'foo';
      const parameterValue = 'bar';
      const client = mockClient(DynamoDBClient)
        .on(GetItemCommand)
        .resolves({
          Item: marshall({
            id: parameterName,
            value: parameterValue,
          }),
        });

      // Act
      await provider.get(parameterName, {
        sdkOptions: {
          TableName: 'override-table',
          Key: marshall({
            id: 'override-name',
          }),
          ProjectionExpression: 'override-value',
        } as unknown as GetItemCommandInput,
      });

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          id: parameterName,
        }),
        ExpressionAttributeNames: {
          '#value': 'value',
        },
        ProjectionExpression: '#value',
      });
    });
  });

  describe('Method: _getMultiple', () => {
    test('when called with only a path, it gets the parameters using the default attribute values and table name', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      const client = mockClient(DynamoDBClient)
        .on(QueryCommand)
        .resolves({
          Items: [
            marshall({
              id: parameterPath,
              sk: 'a',
              value: 'parameter-a',
            }),
            marshall({
              id: parameterPath,
              sk: 'b',
              value: 'parameter-b',
            }),
            marshall({
              id: parameterPath,
              sk: 'c',
              value: 'parameter-c',
            }),
          ],
        });

      // Act
      const parameters = await provider.getMultiple(parameterPath);

      // Assess
      expect(client).toReceiveCommandWith(QueryCommand, {
        TableName: 'test-table',
        KeyConditionExpression: '#key = :key',
        ExpressionAttributeValues: marshall({
          ':key': parameterPath,
        }),
        ExpressionAttributeNames: {
          '#key': 'id',
          '#sk': 'sk',
          '#value': 'value',
        },
        ProjectionExpression: '#sk, #value',
      });
      expect(parameters).toEqual({
        a: 'parameter-a',
        b: 'parameter-b',
        c: 'parameter-c',
      });
    });

    test('when called with only a path, it gets the parameter using the attribute values and table name provided to the constructor', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
        keyAttr: 'key',
        valueAttr: 'val',
        sortAttr: 'sort',
      });
      const parameterPath = 'foo';
      const client = mockClient(DynamoDBClient)
        .on(QueryCommand)
        .resolves({
          Items: [
            marshall({
              key: parameterPath,
              sort: 'a',
              val: 'parameter-a',
            }),
            marshall({
              key: parameterPath,
              sort: 'b',
              val: 'parameter-b',
            }),
            marshall({
              key: parameterPath,
              sort: 'c',
              val: 'parameter-c',
            }),
          ],
        });

      // Act
      const parameters = await provider.getMultiple(parameterPath);

      // Assess
      expect(client).toReceiveCommandWith(QueryCommand, {
        TableName: 'test-table',
        KeyConditionExpression: '#key = :key',
        ExpressionAttributeValues: marshall({
          ':key': parameterPath,
        }),
        ExpressionAttributeNames: {
          '#key': 'key',
          '#sk': 'sort',
          '#value': 'val',
        },
        ProjectionExpression: '#sk, #value',
      });
      expect(parameters).toEqual({
        a: 'parameter-a',
        b: 'parameter-b',
        c: 'parameter-c',
      });
    });

    test('when called with a path and sdkOptions, it gets the parameters using the options provided', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      const client = mockClient(DynamoDBClient)
        .on(QueryCommand)
        .resolves({
          Items: [
            marshall({
              id: parameterPath,
              sk: 'a',
              value: 'parameter-a',
            }),
            marshall({
              id: parameterPath,
              sk: 'b',
              value: 'parameter-b',
            }),
            marshall({
              id: parameterPath,
              sk: 'c',
              value: 'parameter-c',
            }),
          ],
        });

      // Act
      const parameters = await provider.getMultiple(parameterPath, {
        sdkOptions: {
          ConsistentRead: true,
          Limit: 10,
        },
      });

      // Assess
      expect(client).toReceiveCommandWith(QueryCommand, {
        TableName: 'test-table',
        KeyConditionExpression: '#key = :key',
        ExpressionAttributeValues: marshall({
          ':key': parameterPath,
        }),
        ExpressionAttributeNames: {
          '#key': 'id',
          '#sk': 'sk',
          '#value': 'value',
        },
        ProjectionExpression: '#sk, #value',
        ConsistentRead: true,
      });
      expect(parameters).toEqual({
        a: 'parameter-a',
        b: 'parameter-b',
        c: 'parameter-c',
      });
    });

    test('when multiple pages are found, it returns an object with all the parameters', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      mockClient(DynamoDBClient)
        .on(QueryCommand)
        .resolvesOnce({
          Items: [
            marshall({
              id: parameterPath,
              sk: 'a',
              value: 'parameter-a',
            }),
            marshall({
              id: parameterPath,
              sk: 'b',
              value: 'parameter-b',
            }),
          ],
          LastEvaluatedKey: marshall({
            id: parameterPath,
            sk: 'b',
          }),
        })
        .resolvesOnce({
          Items: [
            marshall({
              id: parameterPath,
              sk: 'c',
              value: 'parameter-c',
            }),
          ],
          LastEvaluatedKey: marshall({
            id: parameterPath,
            sk: 'c',
          }),
        })
        .resolves({});

      // Act
      const parameters = await provider.getMultiple(parameterPath);

      // Assess
      expect(parameters).toEqual({
        a: 'parameter-a',
        b: 'parameter-b',
        c: 'parameter-c',
      });
    });

    test('when called with sdkOptions that override arguments or internals, it discards the ones passed in sdkOptions and leaves others untouched', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      const client = mockClient(DynamoDBClient)
        .on(QueryCommand)
        .resolves({
          Items: [
            marshall({
              id: parameterPath,
              sk: 'a',
              value: 'parameter-a',
            }),
            marshall({
              id: parameterPath,
              sk: 'b',
              value: 'parameter-b',
            }),
            marshall({
              id: parameterPath,
              sk: 'c',
              value: 'parameter-c',
            }),
          ],
        });

      // Act
      await provider.getMultiple(parameterPath, {
        sdkOptions: {
          KeyConditionExpression: '#key = :key',
          ExpressionAttributeValues: marshall({
            ':myKey': 'foo',
          }),
          ConsistentRead: true,
          ProjectionExpression: 'sort, val',
          Limit: 10,
        } as unknown as QueryCommandInput,
      });

      // Assess
      expect(client).toReceiveCommandWith(QueryCommand, {
        TableName: 'test-table',
        KeyConditionExpression: '#key = :key',
        ExpressionAttributeValues: marshall({
          ':key': parameterPath,
        }),
        ExpressionAttributeNames: {
          '#key': 'id',
          '#sk': 'sk',
          '#value': 'value',
        },
        ProjectionExpression: '#sk, #value',
        ConsistentRead: true,
        Limit: 10,
      });
    });
  });
});
