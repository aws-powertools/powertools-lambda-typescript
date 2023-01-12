/**
 * Test DynamoDBProvider basic features
 *
 * @group e2e/parameters/dynamodb/basicFeatures
 */
import path from 'path';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { App, Stack, Aspects } from 'aws-cdk-lib';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 } from 'uuid';
import { 
  generateUniqueName, 
  isValidRuntimeKey, 
  createStackWithLambdaFunction, 
  invokeFunction, 
} from '../../../commons/tests/utils/e2eUtils';
import { InvocationLogs } from '../../../commons/tests/utils/InvocationLogs';
import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';
import { ResourceAccessGranter } from '../helpers/cdkAspectGrantAccess';
import { 
  RESOURCE_NAME_PREFIX, 
  SETUP_TIMEOUT, 
  TEARDOWN_TIMEOUT, 
  TEST_CASE_TIMEOUT 
} from './constants';
import { createDynamoDBTable } from '../helpers/parametersUtils';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = v4();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'dynamoDBProvider');
const functionName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'dynamoDBProvider');
const lambdaFunctionCodeFile = 'basicFeatures.dynamoDBProvider.test.functionCode.ts';

const dynamoDBClient = new DynamoDBClient({});

const invocationCount = 1;
// const startTime = new Date();

// Parameters to be used by Parameters in the Lambda function
const tableGet = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'dynamoDBProvider-Table-Get');
const tableGetMultiple = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'dynamoDBProvider-Table-GetMultiple');
const tableGetCustomkeys = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'dynamoDBProvider-Table-GetCustomKeys');
const tableGetMultipleCustomkeys = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'dynamoDBProvider-Table-GetMultipleCustomKeys');
const keyAttr = 'key';
const sortAttr = 'sort';
const valueAttr = 'val';

const integTestApp = new App();
let stack: Stack;

describe(`parameters E2E tests (dynamoDBProvider) for runtime: nodejs18x`, () => {

  let invocationLogs: InvocationLogs[];

  beforeAll(async () => {
    // GIVEN a stack
    stack = createStackWithLambdaFunction({
      app: integTestApp,
      stackName: stackName,
      functionName: functionName,
      functionEntry: path.join(__dirname, lambdaFunctionCodeFile),
      tracing: Tracing.ACTIVE,
      environment: {
        UUID: uuid,

        // Values(s) to be used by Parameters in the Lambda function
        TABLE_GET: tableGet,
        TABLE_GET_MULTIPLE: tableGetMultiple,
        TABLE_GET_CUSTOM_KEYS: tableGetCustomkeys,
        TABLE_GET_MULTIPLE_CUSTOM_KEYS: tableGetMultipleCustomkeys,
        KEY_ATTR: keyAttr,
        SORT_ATTR: sortAttr,
        VALUE_ATTR: valueAttr,
      },
      runtime: runtime,
    });

    // Create the DynamoDB tables
    const ddbTableGet = createDynamoDBTable({
      stack,
      id: 'Table-get',
      tableName: tableGet,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
    });
    const ddbTableGetMultiple = createDynamoDBTable({
      stack,
      id: 'Table-getMultiple',
      tableName: tableGetMultiple,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING
      }
    });
    const ddbTableGetCustomKeys = createDynamoDBTable({
      stack,
      id: 'Table-getCustomKeys',
      tableName: tableGetCustomkeys,
      partitionKey: {
        name: keyAttr,
        type: AttributeType.STRING
      },
    });
    const ddbTabelGetMultipleCustomKeys = createDynamoDBTable({
      stack,
      id: 'Table-getMultipleCustomKeys',
      partitionKey: {
        name: keyAttr,
        type: AttributeType.STRING
      },
      sortKey: {
        name: sortAttr,
        type: AttributeType.STRING
      },
    });

    // Give the Lambda access to the DynamoDB tables
    Aspects.of(stack).add(new ResourceAccessGranter([
      ddbTableGet,
      ddbTableGetMultiple,
      ddbTableGetCustomKeys,
      ddbTabelGetMultipleCustomKeys,
    ]));

    await deployStack(integTestApp, stack);

    // Seed tables with test data
    // Test 1
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGet,
      Item: marshall({
        id: 'my-param',
        value: 'foo',
      }),
    }));

    // Test 2
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGetMultiple,
      Item: marshall({
        id: 'my-params',
        sk: 'config',
        value: 'bar',
      }),
    }));
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGetMultiple,
      Item: marshall({
        id: 'my-params',
        sk: 'key',
        value: 'baz',
      }),
    }));

    // Test 3
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGetCustomkeys,
      Item: marshall({
        [keyAttr]: 'my-param',
        [valueAttr]: 'foo',
      }),
    }));

    // Test 4
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGetMultipleCustomkeys,
      Item: marshall({
        [keyAttr]: 'my-params',
        [sortAttr]: 'config',
        [valueAttr]: 'bar',
      }),
    }));
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGetMultipleCustomkeys,
      Item: marshall({
        [keyAttr]: 'my-params',
        [sortAttr]: 'key',
        [valueAttr]: 'baz',
      }),
    }));
    
    // Test 5
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGet,
      Item: marshall({
        id: 'my-param-json',
        value: JSON.stringify({ foo: 'bar' }),
      }),
    }));

    // Test 6
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGet,
      Item: marshall({
        id: 'my-param-binary',
        value: 'YmF6', // base64 encoded 'baz'
      }),
    }));

    // Test 7
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGetMultiple,
      Item: marshall({
        id: 'my-encoded-params',
        sk: 'config.json',
        value: JSON.stringify({ foo: 'bar' }),
      }),
    }));
    await dynamoDBClient.send(new PutItemCommand({
      TableName: tableGetMultiple,
      Item: marshall({
        id: 'my-encoded-params',
        sk: 'key.binary',
        value: 'YmF6', // base64 encoded 'baz'
      }),
    }));

    // Test 8 & 9 use the same items as Test 1

    // and invoke the Lambda function
    invocationLogs = await invokeFunction(functionName, invocationCount, 'SEQUENTIAL');

  }, SETUP_TIMEOUT);

  describe('DynamoDBProvider usage', () => {

    // Test 1 - get a single parameter with default options (keyAttr: 'id', valueAttr: 'value')
    it('should retrieve a single parameter', async () => {
      
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[0]);

      expect(testLog).toStrictEqual({
        test: 'get',
        value: 'foo',
      });

    }, TEST_CASE_TIMEOUT);

    // Test 2 - get multiple parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value')
    it('should retrieve multiple parameters', async () => {
      
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[1]);

      expect(testLog).toStrictEqual({
        test: 'get-multiple',
        value: { config: 'bar', key: 'baz' },
      });

    }, TEST_CASE_TIMEOUT);

    // Test 3 - get a single parameter with custom options (keyAttr: 'key', valueAttr: 'val')
    it('should retrieve a single parameter', async () => {
      
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[2]);

      expect(testLog).toStrictEqual({
        test: 'get-custom',
        value: 'foo',
      });

    }, TEST_CASE_TIMEOUT);

    // Test 4 - get multiple parameters with custom options (keyAttr: 'key', sortAttr: 'sort', valueAttr: 'val')
    it('should retrieve multiple parameters', async () => {
      
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[3]);

      expect(testLog).toStrictEqual({
        test: 'get-multiple-custom',
        value: { config: 'bar', key: 'baz' },
      });

    }, TEST_CASE_TIMEOUT);

    // Test 5 - get a single parameter with json transform
    it('should retrieve a single parameter with json transform', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[4]);

      expect(testLog).toStrictEqual({
        test: 'get-json-transform',
        value: 'object',
      });

    });

    // Test 6 - get a single parameter with binary transform
    it('should retrieve a single parameter with binary transform', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[4]);

      expect(testLog).toStrictEqual({
        test: 'get-binary-transform',
        value: 'string', // as opposed to Uint8Array
      });

    });

    // Test 7 - get multiple parameters with auto transforms (json and binary)
    it('should retrieve multiple parameters with auto transforms', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[5]);

      expect(testLog).toStrictEqual({
        test: 'get-multiple-auto-transform',
        value: 'object,string',
      });

    });

    // Test 8 - get a parameter twice, second time should be cached
    // Test 9 - get a parameter once more but with forceFetch = true

  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);
});
