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
const testFunctionNameCustom = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'idp-custom');
const testFunctionNameFails = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'idp-fails');
const testFunctionNameKeywordArg = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'idp-keywordarg');
const app = new App();
let stack: Stack;
const ddbTableName = stackName + '-idempotency-table';
describe('Idempotency e2e test, default settings', () => {

  let invocationLogsSequential: InvocationLogs[];
  let invocationLogsParallel: InvocationLogs[];
  let invocationLogsCustmozed: InvocationLogs[];
  const ddb = new DynamoDBClient({ region: 'eu-west-1' });

  const payload = { foo: 'baz' };
  const payloadArray = { records: [ { id: 1, foo: 'bar' }, { id: 2, foo: 'baq' }, { id: 3, foo: 'bar' } ] };
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
    ddbTable.grantReadWriteData(sequntialExecutionFunction);

    const parallelExecutionFunction = new NodejsFunction(stack, 'IdemppotentFucntionParallel', {
      runtime: TEST_RUNTIMES[runtime],
      functionName: testFunctionNameParallel,
      entry: path.join(__dirname, 'idempotencyDecorator.test.FunctionCode.ts'),
      timeout: Duration.seconds(30),
      handler: 'handler',
      environment: {
        IDEMPOTENCY_TABLE_NAME: ddbTable.tableName,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      },
    });
    ddbTable.grantReadWriteData(parallelExecutionFunction);

    const ddbTableCustomized = new Table(stack, 'TableCustomized', {
      tableName: ddbTableName + '-customized',
      partitionKey: {
        name: 'customId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const customizedPersistenceLayerFunction = new NodejsFunction(stack, 'CustomisedIdempotencyDecorator', {
      runtime: TEST_RUNTIMES[runtime],
      functionName: testFunctionNameCustom,
      entry: path.join(__dirname, 'idempotencyDecorator.test.FunctionCode.ts'),
      timeout: Duration.seconds(30),
      handler: 'handlerCustomized',
      environment: {
        IDEMPOTENCY_TABLE_NAME: ddbTableCustomized.tableName,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true'
      },
    });

    ddbTableCustomized.grantReadWriteData(customizedPersistenceLayerFunction);

    const failsFunction = new NodejsFunction(stack, 'IdempotentFucntionFails', {
      runtime: TEST_RUNTIMES[runtime],
      functionName: testFunctionNameFails,
      entry: path.join(__dirname, 'idempotencyDecorator.test.FunctionCode.ts'),
      timeout: Duration.seconds(30),
      handler: 'handlerFails',
      environment: {
        IDEMPOTENCY_TABLE_NAME: ddbTable.tableName,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true'
      },
    });

    ddbTable.grantReadWriteData(failsFunction);

    const dataKeywordArgFunction = new NodejsFunction(stack, 'IdempotentFucntionKeywordArg', {
      runtime: TEST_RUNTIMES[runtime],
      functionName: testFunctionNameKeywordArg,
      entry: path.join(__dirname, 'idempotencyDecorator.test.FunctionCode.ts'),
      timeout: Duration.seconds(30),
      handler: 'handlerWithKeywordArgument',
      environment: {
        IDEMPOTENCY_TABLE_NAME: ddbTable.tableName,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true'
      },
    });

    ddbTable.grantReadWriteData(dataKeywordArgFunction);

    await deployStack(app, stack);

  }, SETUP_TIMEOUT);

  it('when called twice, it returns the same value without calling the inner function', async () => {
    invocationLogsSequential = await invokeFunction(testFunctionNameSequential, 2, 'SEQUENTIAL', payload, false);
    // create dynamodb client to query the table and check the value
    const idempotencyKey = `${testFunctionNameSequential}#${payloadHash}`;
    await ddb.send(new GetCommand({ TableName: ddbTableName, Key: { id: idempotencyKey } })).then((data) => {
      expect(data?.Item?.data).toEqual('Hello World');
      expect(data?.Item?.status).toEqual('COMPLETED');
      expect(data?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
      // we log events inside the handler, so the 2nd invocation should not log anything
      expect(invocationLogsSequential[0].getFunctionLogs().toString()).toContain('Got test event');
      expect(invocationLogsSequential[1].getFunctionLogs().toString()).not.toContain('Got test event');
    });

  }, TEST_CASE_TIMEOUT);

  it('when called twice in parallel, it trows an error', async () => {
    invocationLogsParallel = await invokeFunction(testFunctionNameParallel, 2, 'PARALLEL', payload, false);
    // create dynamodb client to query the table and check the value
    const idempotencyKey = `${testFunctionNameParallel}#${payloadHash}`;
    await ddb.send(new GetCommand({ TableName: ddbTableName, Key: { id: idempotencyKey } })).then((data) => {
      expect(data?.Item?.data).toEqual('Hello World');
      expect(data?.Item?.status).toEqual('COMPLETED');
      expect(data?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
      expect(invocationLogsParallel[0].getFunctionLogs(LEVEL.ERROR).toString()).toContain('There is already an execution in progress with idempotency key');
    });
  }, TEST_CASE_TIMEOUT);

  it('when called with customized idempotency decorator, it creates ddb entry with custom attributes', async () => {
    invocationLogsCustmozed = await invokeFunction(testFunctionNameCustom, 1, 'PARALLEL', payload, false);
    const idempotencyKey = `${testFunctionNameCustom}#${payloadHash}`;
    await ddb.send(new GetCommand({
      TableName: `${ddbTableName}-customized`,
      Key: { customId: idempotencyKey }
    })).then((data) => {
      expect(data?.Item?.dataattr).toEqual('Hello World Customized');
      expect(data?.Item?.statusattr).toEqual('COMPLETED');
      expect(data?.Item?.expiryattr).toBeGreaterThan(Date.now() / 1000);
      expect(invocationLogsCustmozed[0].getFunctionLogs().toString()).toContain('Got test event customized');
    });
  }, TEST_CASE_TIMEOUT);

  it('when called with a function that fails, it creates ddb entry with error status', async () => {
    await invokeFunction(testFunctionNameFails, 1, 'PARALLEL', payload, false);
    const idempotencyKey = `${testFunctionNameFails}#${payloadHash}`;
    console.log(idempotencyKey);
    await ddb.send(new GetCommand({
      TableName: ddbTableName,
      Key: { id: idempotencyKey }
    })).then((data) => {
      console.log(data);
      expect(data?.Item).toBeUndefined();
    });
  }, TEST_CASE_TIMEOUT);

  it('when called with a function that has keyword argument, it creates ddb entry with error status', async () => {
    await invokeFunction(testFunctionNameKeywordArg, 2, 'SEQUENTIAL', payloadArray, false);
    const payloadHashFirst = createHash('md5').update('"bar"').digest('base64');
    const payloadHashSecond = createHash('md5').update('"baq"').digest('base64');
    const resultFirst = await ddb.send(new GetCommand({
      TableName: ddbTableName,
      Key: { id: `${testFunctionNameKeywordArg}#${payloadHashFirst}` }
    }));
    expect(resultFirst?.Item?.data).toEqual('idempotent result: bar');
    expect(resultFirst?.Item?.status).toEqual('COMPLETED');
    expect(resultFirst?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);

    const resultSecond = await ddb.send(new GetCommand({
      TableName: ddbTableName,
      Key: { id: `${testFunctionNameKeywordArg}#${payloadHashSecond}` }
    }));
    expect(resultSecond?.Item?.data).toEqual('idempotent result: baq');
    expect(resultSecond?.Item?.status).toEqual('COMPLETED');
    expect(resultSecond?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(app, stack);
    }
  }, TEARDOWN_TIMEOUT);
});