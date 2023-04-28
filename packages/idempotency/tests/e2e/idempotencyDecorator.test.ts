/**
 * Test idempotency decorator
 *
 * @group e2e/idempotency
 */
import { v4 } from 'uuid';
import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import {
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey,
  TEST_RUNTIMES
} from '../../../commons/tests/utils/e2eUtils';
import { RESOURCE_NAME_PREFIX, SETUP_TIMEOUT, TEARDOWN_TIMEOUT, TEST_CASE_TIMEOUT } from './constants';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'IdempotencyDecorator');
const testFunctionName = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'IdempotencyDecoratorFunction');
const app = new App();
let stack: Stack;
const ddbTableName = stackName + '-idempotency-table';
describe('Idempotency e2e test, basic features', () => {

  beforeAll(async () => {
    stack = new Stack(app, stackName);
    const ddbTable = new Table(stack, 'Table', {
      tableName: ddbTableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const testFunction = new NodejsFunction(stack, 'IdemppotentFucntion', {
      runtime: TEST_RUNTIMES[runtime],
      functionName: testFunctionName,
      entry: path.join(__dirname, 'idempotencyDecorator.test.FunctionCode.ts'),
      handler: 'handler',
      environment: {
        IDEMPOTENCY_TABLE_NAME: ddbTableName,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      }
    });

    ddbTable.grantReadWriteData(testFunction);

    await deployStack(app, stack);

    await Promise.all([
      invokeFunction(testFunctionName, 1, 'SEQUENTIAL', { username: 'foo' }, false),
    ]);

  }, SETUP_TIMEOUT);

  it('when called, it returns the same value', async () => {
    // create dynamodb client to query the table and check the value
    const ddb = new DynamoDBClient({ region: 'eu-west-1' });
    await ddb.send(new ScanCommand({ TableName: ddbTableName })).then((data) => {
      expect(data.Items?.length).toEqual(1);
      expect(data.Items?.[0].data?.S).toEqual('Hello World foo');
      expect(data.Items?.[0].status?.S).toEqual('COMPLETED');

    });
  }, TEST_CASE_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(app, stack);
    }
  }, TEARDOWN_TIMEOUT);
});