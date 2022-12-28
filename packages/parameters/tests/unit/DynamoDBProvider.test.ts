/**
   * Test DynamoDBProvider class
  *
  * @group unit/parameters/DynamoDBProvider/class
  */
import { DynamoDBProvider } from '../../src/DynamoDBProvider';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
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
    
    test('when called without attribute options, it gets the parameter using the default attribute values', async () => {

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
      const value = await provider.get(parameterName);
      
      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          id: parameterName,
        }),
      });
      expect(value).toEqual(parameterValue);

    });

    test('when called without attribute options, it gets the parameter using the attribute values provided to the constructor', async () => {

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
      const value = await provider.get(parameterName);

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          key: parameterName,
        }),
      });
      expect(value).toEqual(parameterValue);

    });

    test('when called with attribute options, it gets the parameter using the default attribute values', async () => {

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
      const value = await provider.get(parameterName, {
        sdkOptions: {
          TableName: 'test-table',
        }
      });

      // Assess
      expect(client).toReceiveCommandWith(GetItemCommand, {
        TableName: 'test-table',
        Key: marshall({
          id: parameterName,
        }),
      });
      expect(value).toEqual(parameterValue);

    });

  });

});