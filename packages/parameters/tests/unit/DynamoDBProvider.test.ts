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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamoDBProvider } from '../../src/dynamodb/index.js';
import type { DynamoDBProviderOptions } from '../../src/types/DynamoDBProvider.js';

vi.mock('@aws-lambda-powertools/commons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-lambda-powertools/commons')>()),
  addUserAgentMiddleware: vi.fn(),
}));

describe('Class: DynamoDBProvider', () => {
  const client = mockClient(DynamoDBClient);

  beforeEach(() => {
    client.reset();
  });

  describe('Method: constructor', () => {
    it('instantiates a new AWS SDK with default options', async () => {
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

    it('uses the provided config to instantiate a new AWS SDK', async () => {
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
      await expect(provider.client.config.region()).resolves.toEqual(
        'eu-south-2'
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    it('uses the provided AWS SDK client', async () => {
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

      // Act
      const provider = new DynamoDBProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'DynamoDB',
        })
      );
      expect(console.warn).toHaveBeenNthCalledWith(
        1,
        'awsSdkV3Client is not an AWS SDK v3 client, using default client'
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });
  });

  describe('Method: _get', () => {
    it('returns undefined when the underlying sdk client returns no items', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      client.on(GetItemCommand).resolves({});

      // Act
      const parameter = await provider.get(parameterPath);

      // Assess
      expect(parameter).toBeUndefined();
    });

    it('gets the parameter using default key and table names when called with only a name', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterName = 'foo';
      const parameterValue = 'bar';
      client.on(GetItemCommand).resolves({
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

    it('uses the key and table name set in the constructor', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
        keyAttr: 'key',
        valueAttr: 'val',
      });
      const parameterName = 'foo';
      const parameterValue = 'bar';
      client.on(GetItemCommand).resolves({
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

    it('uses the provided sdkOptions', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterName = 'foo';
      const parameterValue = 'bar';
      client.on(GetItemCommand).resolves({
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

    it('uses the sdkOptions overrides passed to the method', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterName = 'foo';
      const parameterValue = 'bar';
      client.on(GetItemCommand).resolves({
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
    it('uses the default key and table name when called with only a path', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      client.on(QueryCommand).resolves({
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

    it('uses the key and table name set in the constructor when called with only a path', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
        keyAttr: 'key',
        valueAttr: 'val',
        sortAttr: 'sort',
      });
      const parameterPath = 'foo';
      client.on(QueryCommand).resolves({
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

    it('uses the provided sdkOptions', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      client.on(QueryCommand).resolves({
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

    it('scrolls through the pages and aggregates the results when multiple pages are found', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      client
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

    it('uses the provided sdkOptions overrides but discards internal configs that should not be overridden', async () => {
      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      client.on(QueryCommand).resolves({
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
