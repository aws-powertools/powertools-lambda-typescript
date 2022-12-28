/**
   * Test DynamoDBProvider class
  *
  * @group unit/parameters/DynamoDBProvider/class
  */
import { DynamoDBProvider } from '../../src/DynamoDBProvider';
import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import type { GetItemCommandInput, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
/* import type {
  DynamoDBGetOptionsInterface,
  DynamoDBGetMultipleOptionsInterface,
} from '../../src/types/DynamoDBProvider'; */

describe('Class: DynamoDBProvider', () => {

  beforeEach(() => {
    jest.clearAllMocks();
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
      const client = mockClient(DynamoDBClient).on(GetItemCommand).resolves({
        Item: marshall({
          id: parameterName,
          value: parameterValue,
        })
      });

      // Act
      const parameter = await provider.get(parameterName);
      
      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          id: parameterName,
        }),
        ProjectionExpression: 'value',
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
      const client = mockClient(DynamoDBClient).on(GetItemCommand).resolves({
        Item: marshall({
          key: parameterName,
          val: parameterValue,
        })
      });

      // Act
      const parameter = await provider.get(parameterName);

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          key: parameterName,
        }),
        ProjectionExpression: 'val',
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
      const client = mockClient(DynamoDBClient).on(GetItemCommand).resolves({
        Item: marshall({
          id: parameterName,
          value: parameterValue,
        })
      });

      // Act
      const parameter = await provider.get(parameterName, {
        sdkOptions: {
          ConsistentRead: true,
        }
      });

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          id: parameterName,
        }),
        ProjectionExpression: 'value',
        ConsistentRead: true,
      });
      expect(parameter).toEqual(parameterValue);

    });

  });

  describe('Method: _getMultiple', () => {

    test('when called with only a path, it gets the parameters using the default attribute values and table name', async () => {

      // Prepare
      const provider = new DynamoDBProvider({
        tableName: 'test-table',
      });
      const parameterPath = 'foo';
      const client = mockClient(DynamoDBClient).on(QueryCommand).resolves({
        Items: [
          marshall({
            id: 'foo',
            sk: 'a',
            value: 'parameter-a'
          }),
          marshall({
            id: 'foo',
            sk: 'b',
            value: 'parameter-b'
          }),
          marshall({
            id: 'foo',
            sk: 'c',
            value: 'parameter-c'
          }),
        ]
      });

      // Act
      const parameters = await provider.getMultiple(parameterPath);

      // Assess
      expect(client).toReceiveCommandWith(QueryCommand, {
        TableName: 'test-table',
        KeyConditionExpression: `id = :key`,
        ExpressionAttributeValues: marshall({
          ':key': parameterPath,
        }),
        ProjectionExpression: 'sk, value',
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
      const client = mockClient(DynamoDBClient).on(QueryCommand).resolves({
        Items: [
          marshall({
            key: 'foo',
            sort: 'a',
            val: 'parameter-a'
          }),
          marshall({
            key: 'foo',
            sort: 'b',
            val: 'parameter-b'
          }),
          marshall({
            key: 'foo',
            sort: 'c',
            val: 'parameter-c'
          }),
        ]
      });

      // Act
      const parameters = await provider.getMultiple(parameterPath);

      // Assess
      expect(client).toReceiveCommandWith(QueryCommand, {
        TableName: 'test-table',
        KeyConditionExpression: `key = :key`,
        ExpressionAttributeValues: marshall({
          ':key': parameterPath,
        }),
        ProjectionExpression: 'sort, val',
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
      const client = mockClient(DynamoDBClient).on(QueryCommand).resolves({
        Items: [
          marshall({
            id: 'foo',
            sk: 'a',
            value: 'parameter-a'
          }),
          marshall({
            id: 'foo',
            sk: 'b',
            value: 'parameter-b'
          }),
          marshall({
            id: 'foo',
            sk: 'c',
            value: 'parameter-c'
          }),
        ]
      });

      // Act
      const parameters = await provider.getMultiple(parameterPath, {
        sdkOptions: {
          ConsistentRead: true,
          Limit: 10,
        }
      });

      // Assess
      expect(client).toReceiveCommandWith(QueryCommand, {
        TableName: 'test-table',
        KeyConditionExpression: `id = :key`,
        ExpressionAttributeValues: marshall({
          ':key': parameterPath,
        }),
        ProjectionExpression: 'sk, value',
        ConsistentRead: true,
        Limit: 10,
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
      mockClient(DynamoDBClient).on(QueryCommand)
        .resolvesOnce({
          Items: [
            marshall({
              id: 'foo',
              sk: 'a',
              value: 'parameter-a'
            }),
            marshall({
              id: 'foo',
              sk: 'b',
              value: 'parameter-b'
            }),
          ],
          LastEvaluatedKey: marshall({
            id: 'foo',
            sk: 'b',
          }),
        })
        .resolvesOnce({
          Items: [
            marshall({
              id: 'foo',
              sk: 'c',
              value: 'parameter-c'
            }),
          ],
          LastEvaluatedKey: marshall({
            id: 'foo',
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

  });

  describe('Method: isGetItemCommandInput', () => {

    class DummyProvider extends DynamoDBProvider {
      public isGetItemCommandInput(options: GetItemCommandInput | QueryCommandInput): options is GetItemCommandInput {
        return super.isGetItemCommandInput(options);
      }
    }

    test('when called with a valid GetItemCommandInput, it returns true', () => {

      // Prepare
      const provider = new DummyProvider({
        tableName: 'test-table',
      });

      // Act & Assess
      expect(provider.isGetItemCommandInput({
        TableName: 'test-table',
        Key: marshall({
          id: 'foo',
        }),
      })).toBe(true);

    });

    test('when called with a valid QueryCommandInput, it returns false', () => {

      // Prepare
      const provider = new DummyProvider({
        tableName: 'test-table',
      });

      // Act & Assess
      expect(provider.isGetItemCommandInput({
        TableName: 'test-table',
        KeyConditionExpression: `id = :key`,
        ExpressionAttributeValues: marshall({
          ':key': 'foo',
        }),
      })).toBe(false);

    });

  });

  describe('Method: removeNonOverridableOptions', () => {

    class DummyProvider extends DynamoDBProvider {
      public removeNonOverridableOptions(options: GetItemCommandInput | QueryCommandInput): void {
        super.removeNonOverridableOptions(options);
      }
    }

    test('when called with a valid GetItemCommandInput, it removes the non-overridable options', () => {

      // Prepare
      const provider = new DummyProvider({
        tableName: 'test-table',
      });
      const options: GetItemCommandInput = {
        TableName: 'test-table',
        Key: marshall({
          id: 'foo',
        }),
        ConsistentRead: true,
        ProjectionExpression: 'sk, value',
      };

      // Act
      provider.removeNonOverridableOptions(options);

      // Assess
      expect(options).toEqual({
        ConsistentRead: true,
      });

    });

    test('when called with a valid QueryCommandInput, it removes the non-overridable options', () => {

      // Prepare
      const provider = new DummyProvider({
        tableName: 'test-table',
      });
      const options: QueryCommandInput = {
        TableName: 'test-table',
        KeyConditionExpression: `id = :key`,
        ExpressionAttributeValues: marshall({
          ':key': 'foo',
        }),
        ConsistentRead: true,
        ProjectionExpression: 'sk, value',
        Limit: 10,
      };

      // Act
      provider.removeNonOverridableOptions(options);

      // Assess
      expect(options).toEqual({
        ConsistentRead: true,
        Limit: 10,
      });

    });

  });

});