/**
 * Test idempotency decorator
 *
 * @group e2e/idempotency
 */
import { v4 } from 'uuid';
import { App, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
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
import { InvocationLogs, LEVEL } from '../../../commons/tests/utils/InvocationLogs';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'node:crypto';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'IdempotencyDecorator');
const testFunctionNameSequential = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'idp-sequential');
const testFunctionNameParallel = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'idp-parallel');
const app = new App();
let stack: Stack;
const ddbTableName = stackName + '-idempotency-table';
describe('Idempotency e2e test, default settings', () => {

  let invocationLogsSequential: InvocationLogs[];
  let invocationLogsParallel: InvocationLogs[];
  const payload = { foo: 'baz' };
  const payloadHash = createHash('md5').update(JSON.stringify(payload)).digest('base64');

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

    const sequntialExecutionFunction = new NodejsFunction(stack, 'IdempotentFucntionSequential', {
      runtime: TEST_RUNTIMES[runtime],
      functionName: testFunctionNameSequential,
      entry: path.join(__dirname, 'idempotencyDecorator.test.FunctionCode.ts'),
      timeout: Duration.seconds(30),
      handler: 'handler',
      environment: {
        IDEMPOTENCY_TABLE_NAME: ddbTableName,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      },
    });

    const parallelExecutionFunction = new NodejsFunction(stack, 'IdemppotentFucntionParallel', {
      runtime: TEST_RUNTIMES[runtime],
      functionName: testFunctionNameParallel,
      entry: path.join(__dirname, 'idempotencyDecorator.test.FunctionCode.ts'),
      timeout: Duration.seconds(30),
      handler: 'handler',
      environment: {
        IDEMPOTENCY_TABLE_NAME: ddbTableName,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      },
    });

    ddbTable.grantReadWriteData(sequntialExecutionFunction);
    ddbTable.grantReadWriteData(parallelExecutionFunction);

    await deployStack(app, stack);

    invocationLogsSequential = await invokeFunction(testFunctionNameSequential, 2, 'SEQUENTIAL', payload, false);

    invocationLogsParallel = await invokeFunction(testFunctionNameParallel, 2, 'PARALLEL', payload, false);

  }, SETUP_TIMEOUT);

  it('when called twice, it returns the same value without calling the inner function', async () => {
    // create dynamodb client to query the table and check the value
    const ddb = new DynamoDBClient({ region: 'eu-west-1' });
    const idempotencyKey = `${testFunctionNameSequential}#${payloadHash}`;
    console.log(idempotencyKey);
    await ddb.send(new GetCommand({ TableName: ddbTableName, Key: { id: idempotencyKey } })).then((data) => {
      console.log(data);
      expect(data?.Item?.data).toEqual('Hello World');
      expect(data?.Item?.status).toEqual('COMPLETED');
      expect(data?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
      // we log events inside the handler, so the 2nd invocation should not log anything
      expect(invocationLogsSequential[0].getFunctionLogs().toString()).toContain('Got test event');
      expect(invocationLogsSequential[1].getFunctionLogs().toString()).not.toContain('Got test event');
    });

  }, TEST_CASE_TIMEOUT);

  it('when called twice in parallel, it trows an error', async () => {
    // create dynamodb client to query the table and check the value
    const ddb = new DynamoDBClient({ region: 'eu-west-1' });
    const idempotencyKey = `${testFunctionNameParallel}#${payloadHash}`;
    console.log(idempotencyKey);
    await ddb.send(new GetCommand({ TableName: ddbTableName, Key: { id: idempotencyKey } })).then((data) => {
      console.log(data);
      expect(data?.Item?.data).toEqual('Hello World');
      expect(data?.Item?.status).toEqual('COMPLETED');
      expect(data?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
      expect(invocationLogsParallel[0].getFunctionLogs(LEVEL.ERROR).toString()).toContain('There is already an execution in progress with idempotency key');
    });

  }, TEST_CASE_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(app, stack);
    }
  }, TEARDOWN_TIMEOUT);
});