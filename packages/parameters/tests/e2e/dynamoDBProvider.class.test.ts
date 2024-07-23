/**
 * Test DynamoDBProvider class
 *
 * @group e2e/parameters/dynamodb/class
 */
import { join } from 'node:path';
import {
  TestInvocationLogs,
  TestStack,
  invokeFunctionOnce,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { TestDynamodbTableWithItems } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants.js';

/**
 * This test suite deploys a CDK stack with a Lambda function and a number of DynamoDB tables.
 * The function code uses the Parameters utility to retrieve values from the DynamoDB tables.
 * It then logs the values to CloudWatch Logs as JSON.
 *
 * Once the stack is deployed, the Lambda function is invoked and the CloudWatch Logs are retrieved.
 * The logs are then parsed and the values are compared to the expected values in each test case.
 *
 * The tables are populated with data before the Lambda function is invoked. These tables and values
 * allow to test the different use cases of the DynamoDBProvider class.
 *
 * The tables are:
 *
 * - Table-Get: a table with a single partition key (id) and attribute (value)
 * +-----------------+----------------------+
 * |       id        |        value         |
 * +-----------------+----------------------+
 * | my-param        | foo                  |
 * | my-param-json   | "{\"foo\": \"bar\"}" |
 * | my-param-binary | "YmF6"               |
 * +-----------------+----------------------+
 *
 * - Table-GetMultiple: a table with a partition key (id) and a sort key (sk) and attribute (value)
 * +-------------------+---------------+----------------------+
 * |        id         |      sk       |        value         |
 * +-------------------+---------------+----------------------+
 * | my-params         | config        | bar                  |
 * | my-params         | key           | baz                  |
 * | my-encoded-params | config.json   | "{\"foo\": \"bar\"}" |
 * | my-encoded-params | config.binary | "YmF6"               |
 * +-------------------+---------------+----------------------+
 *
 * - Table-GetCustomKeys: a table with a single partition key (key) and attribute (val)
 * +-----------------+----------------------+
 * |       key       |         val          |
 * +-----------------+----------------------+
 * | my-param        | foo                  |
 * +-----------------+----------------------+
 *
 * - Table-GetMultipleCustomKeys: a table with a partition key (key) and a sort key (sort) and attribute (val)
 * +-------------------+---------------+----------------------+
 * |        key        |     sort      |         val          |
 * +-------------------+---------------+----------------------+
 * | my-params         | config        | bar                  |
 * | my-params         | key           | baz                  |
 * +-------------------+---------------+----------------------+
 *
 * The tests are:
 *
 * Test 1
 * Get a single parameter with default options (keyAttr: 'id', valueAttr: 'value') from table Table-Get
 *
 * Test 2
 * Get multiple parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value') from table Table-GetMultiple
 *
 * Test 3
 * Get a single parameter with custom options (keyAttr: 'key', valueAttr: 'val') from table Table-GetCustomKeys
 *
 * Test 4
 * Get multiple parameters with custom options (keyAttr: 'key', sortAttr: 'sort', valueAttr: 'val') from table Table-GetMultipleCustomKeys
 *
 * Test 5
 * Get a single JSON parameter with default options (keyAttr: 'id', valueAttr: 'value') and transform from table Table-Get
 *
 * Test 6
 * Get a single binrary parameter with default options (keyAttr: 'id', valueAttr: 'value') and transform it from table Table-Get
 *
 * Test 7
 * Get multiple JSON and binary parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value') and transform them automatically from table Table-GetMultiple
 *
 * Test 8
 * Get a parameter twice and check that the value is cached. This uses a custom SDK client that counts the number of calls to DynamoDB.
 *
 * Test 9
 * Get a cached parameter and force retrieval. This also uses the same custom SDK client that counts the number of calls to DynamoDB.
 */
describe('Parameters E2E tests, dynamoDB provider', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'DynamoDB',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'dynamoDBProvider.class.test.functionCode.ts'
  );

  const keyAttr = 'key';
  const sortAttr = 'sort';
  const valueAttr = 'val';

  let invocationLogs: TestInvocationLogs;

  beforeAll(async () => {
    // Prepare
    const testFunction = new TestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        environment: {
          KEY_ATTR: keyAttr,
          SORT_ATTR: sortAttr,
          VALUE_ATTR: valueAttr,
        },
      },
      {
        nameSuffix: 'dynamoDBProvider',
      }
    );

    // Table for Test 1, 5, 6
    const tableGet = new TestDynamodbTableWithItems(
      testStack,
      {},
      {
        nameSuffix: 'Table-Get',
        items: [
          {
            id: 'my-param',
            value: 'foo',
          },
          {
            id: 'my-param-json',
            value: JSON.stringify({ foo: 'bar' }),
          },
          {
            id: 'my-param-binary',
            value: 'YmF6', // base64 encoded 'baz'
          },
        ],
      }
    );
    tableGet.grantReadData(testFunction);
    testFunction.addEnvironment('TABLE_GET', tableGet.tableName);
    // Table for Test 2, 7
    const tableGetMultiple = new TestDynamodbTableWithItems(
      testStack,
      {
        sortKey: {
          name: 'sk',
          type: AttributeType.STRING,
        },
      },
      {
        nameSuffix: 'Table-GetMultiple',
        items: [
          {
            id: 'my-params',
            sk: 'config',
            value: 'bar',
          },
          {
            id: 'my-params',
            sk: 'key',
            value: 'baz',
          },
          {
            id: 'my-encoded-params',
            sk: 'config.json',
            value: JSON.stringify({ foo: 'bar' }),
          },
          {
            id: 'my-encoded-params',
            sk: 'key.binary',
            value: 'YmF6', // base64 encoded 'baz'
          },
        ],
      }
    );
    tableGetMultiple.grantReadData(testFunction);
    testFunction.addEnvironment(
      'TABLE_GET_MULTIPLE',
      tableGetMultiple.tableName
    );
    // Table for Test 3
    const tableGetCustomkeys = new TestDynamodbTableWithItems(
      testStack,
      {
        partitionKey: {
          name: keyAttr,
          type: AttributeType.STRING,
        },
      },
      {
        nameSuffix: 'Table-GetCustomKeys',
        items: [
          {
            [keyAttr]: 'my-param',
            [valueAttr]: 'foo',
          },
        ],
      }
    );
    tableGetCustomkeys.grantReadData(testFunction);
    testFunction.addEnvironment(
      'TABLE_GET_CUSTOM_KEYS',
      tableGetCustomkeys.tableName
    );
    // Table for Test 4
    const tableGetMultipleCustomkeys = new TestDynamodbTableWithItems(
      testStack,
      {
        partitionKey: {
          name: keyAttr,
          type: AttributeType.STRING,
        },
        sortKey: {
          name: sortAttr,
          type: AttributeType.STRING,
        },
      },
      {
        nameSuffix: 'Table-GetMultipleCustomKeys',
        items: [
          {
            [keyAttr]: 'my-params',
            [sortAttr]: 'config',
            [valueAttr]: 'bar',
          },
          {
            [keyAttr]: 'my-params',
            [sortAttr]: 'key',
            [valueAttr]: 'baz',
          },
        ],
      }
    );
    tableGetMultipleCustomkeys.grantReadData(testFunction);
    testFunction.addEnvironment(
      'TABLE_GET_MULTIPLE_CUSTOM_KEYS',
      tableGetMultipleCustomkeys.tableName
    );

    // Test 8 & 9 use the same items as Test 1

    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    const functionName =
      testStack.findAndGetStackOutputValue('dynamoDBProvider');

    // and invoke the Lambda function
    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  }, SETUP_TIMEOUT);

  describe('DynamoDBProvider usage', () => {
    // Test 1 - get a single parameter with default options (keyAttr: 'id', valueAttr: 'value')
    it(
      'should retrieve a single parameter',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[0]);

        expect(testLog).toStrictEqual({
          test: 'get',
          value: 'foo',
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 2 - get multiple parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value')
    it(
      'should retrieve multiple parameters',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[1]);

        expect(testLog).toStrictEqual({
          test: 'get-multiple',
          value: { config: 'bar', key: 'baz' },
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 3 - get a single parameter with custom options (keyAttr: 'key', valueAttr: 'val')
    it(
      'should retrieve a single parameter',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[2]);

        expect(testLog).toStrictEqual({
          test: 'get-custom',
          value: 'foo',
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 4 - get multiple parameters with custom options (keyAttr: 'key', sortAttr: 'sort', valueAttr: 'val')
    it(
      'should retrieve multiple parameters',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[3]);

        expect(testLog).toStrictEqual({
          test: 'get-multiple-custom',
          value: { config: 'bar', key: 'baz' },
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 5 - get a single parameter with json transform
    it('should retrieve a single parameter with json transform', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[4]);

      expect(testLog).toStrictEqual({
        test: 'get-json-transform',
        value: { foo: 'bar' },
      });
    });

    // Test 6 - get a single parameter with binary transform
    it('should retrieve a single parameter with binary transform', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[5]);

      expect(testLog).toStrictEqual({
        test: 'get-binary-transform',
        value: 'baz',
      });
    });

    // Test 7 - get multiple parameters with auto transforms (json and binary)
    it('should retrieve multiple parameters with auto transforms', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[6]);

      expect(testLog).toStrictEqual({
        test: 'get-multiple-auto-transform',
        value: {
          'config.json': { foo: 'bar' },
          'key.binary': 'baz',
        },
      });
    });

    // Test 8 - Get a parameter twice and check that the value is cached.
    it('should retrieve multiple parameters with auto transforms', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[7]);

      expect(testLog).toStrictEqual({
        test: 'get-cached',
        value: 1,
      });
    });

    // Test 9 - Get a cached parameter and force retrieval.
    it('should retrieve multiple parameters with auto transforms', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[8]);

      expect(testLog).toStrictEqual({
        test: 'get-forced',
        value: 2,
      });
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
