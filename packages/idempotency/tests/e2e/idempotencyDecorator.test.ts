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
import { LEVEL } from '../../../commons/tests/utils/InvocationLogs';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'node:crypto';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'Idempotency');

const app = new App();
let stack: Stack;

const createIdempotencyResources = (stack: Stack, ddbTableName: string, functionName: string, handler: string, ddbPkId?: string): void => {
  const uniqueTableId = ddbTableName + v4().substring(0, 5);
  const ddbTable = new Table(stack, uniqueTableId, {
    tableName: ddbTableName,
    partitionKey: {
      name: ddbPkId ? ddbPkId : 'id',
      type: AttributeType.STRING,
    },
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY
  });

  const uniqueFunctionId = functionName + v4().substring(0, 5);
  const nodeJsFunction = new NodejsFunction(stack, uniqueFunctionId, {
    runtime: TEST_RUNTIMES[runtime],
    functionName: functionName,
    entry: path.join(__dirname, 'idempotencyDecorator.test.FunctionCode.ts'),
    timeout: Duration.seconds(30),
    handler: handler,
    environment: {
      IDEMPOTENCY_TABLE_NAME: ddbTableName,
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
    }
  });

  ddbTable.grantReadWriteData(nodeJsFunction);

};

describe('Idempotency e2e test, default settings', () => {

  const ddb = new DynamoDBClient({ region: 'eu-west-1' });
  stack = new Stack(app, stackName);

  const functionNameDefault = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'default');
  const ddbTableNameDefault = stackName + '-default-table';
  createIdempotencyResources(stack, ddbTableNameDefault, functionNameDefault, 'handler');

  const functionNameCustom = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'custom');
  const ddbTableNameCustom = stackName + '-custom-table';
  createIdempotencyResources(stack, ddbTableNameCustom, functionNameCustom, 'handlerCustomized', 'customId');

  const functionNameKeywordArg = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'keywordarg');
  const ddbTableNameKeywordArg = stackName + '-keywordarg-table';
  createIdempotencyResources(stack, ddbTableNameKeywordArg, functionNameKeywordArg, 'handlerWithKeywordArgument');

  const functionNameFails = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'fails');
  const ddbTableNameFails = stackName + '-fails-table';
  createIdempotencyResources(stack, ddbTableNameFails, functionNameFails, 'handlerFails');

  beforeAll(async () => {
    await deployStack(app, stack);

  }, SETUP_TIMEOUT);

  test('when called twice, it returns the same value without calling the inner function', async () => {
    const payload = { foo: 'baz' };
    const payloadHash = createHash('md5').update(JSON.stringify(payload)).digest('base64');

    const invocationLogsSequential = await invokeFunction(functionNameDefault, 2, 'SEQUENTIAL', payload, false);
    // create dynamodb client to query the table and check the value
    await ddb.send(new GetCommand({
      TableName: ddbTableNameDefault,
      Key: { id: `${functionNameDefault}#${payloadHash}` }
    })).then((data) => {
      expect(data?.Item?.data).toEqual('Hello World');
      expect(data?.Item?.status).toEqual('COMPLETED');
      expect(data?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
      // we log events inside the handler, so the 2nd invocation should not log anything
      expect(invocationLogsSequential[0].getFunctionLogs().toString()).toContain('Got test event');
      expect(invocationLogsSequential[1].getFunctionLogs().toString()).not.toContain('Got test event');
    });

  }, TEST_CASE_TIMEOUT);

  test('when called twice in parallel, it trows an error', async () => {
    const payload = { id: '123' };
    const payloadHash = createHash('md5').update(JSON.stringify(payload)).digest('base64');
    const invocationLogs = await invokeFunction(functionNameDefault, 2, 'PARALLEL', payload, false);

    await ddb.send(new GetCommand({
      TableName: ddbTableNameDefault,
      Key: { id: `${functionNameDefault}#${payloadHash}` }
    })).then((data) => {
      expect(data?.Item?.data).toEqual('Hello World');
      expect(data?.Item?.status).toEqual('COMPLETED');
      expect(data?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
      expect(invocationLogs[0].getFunctionLogs(LEVEL.ERROR).toString()).toContain('There is already an execution in progress with idempotency key');
    });
  }, TEST_CASE_TIMEOUT);

  test('when called with customized idempotency decorator, it creates ddb entry with custom attributes', async () => {
    const payload = { foo: 'baz' };
    const payloadHash = createHash('md5').update(JSON.stringify(payload)).digest('base64');

    const invocationLogsCustmozed = await invokeFunction(functionNameCustom, 1, 'PARALLEL', payload, false);
    await ddb.send(new GetCommand({
      TableName: ddbTableNameCustom,
      Key: { customId: `${functionNameCustom}#${payloadHash}` }
    })).then((data) => {
      expect(data?.Item?.dataattr).toEqual('Hello World Customized');
      expect(data?.Item?.statusattr).toEqual('COMPLETED');
      expect(data?.Item?.expiryattr).toBeGreaterThan(Date.now() / 1000);
      expect(invocationLogsCustmozed[0].getFunctionLogs().toString()).toContain('Got test event customized');
    });
  }, TEST_CASE_TIMEOUT);

  test('when called with a function that fails, it creates ddb entry with error status', async () => {
    const payload = { foo: 'baz' };
    const payloadHash = createHash('md5').update(JSON.stringify(payload)).digest('base64');

    await invokeFunction(functionNameFails, 1, 'PARALLEL', payload, false);
    await ddb.send(new GetCommand({
      TableName: ddbTableNameFails,
      Key: { id: `${functionNameFails}#${payloadHash}` }
    })).then((data) => {
      console.log(data);
      expect(data?.Item).toBeUndefined();
    });
  }, TEST_CASE_TIMEOUT);

  test('when called with a function that has keyword argument, it creates for every entry of keyword argument', async () => {
    const payloadArray = { records: [ { id: 1, foo: 'bar' }, { id: 2, foo: 'baq' }, { id: 3, foo: 'bar' } ] };
    const payloadHashFirst = createHash('md5').update('"bar"').digest('base64');

    await invokeFunction(functionNameKeywordArg, 2, 'SEQUENTIAL', payloadArray, false);
    await ddb.send(new GetCommand({
      TableName: ddbTableNameKeywordArg,
      Key: { id: `${functionNameKeywordArg}#${payloadHashFirst}` }
    })).then((data) => {
      console.log(data);
      expect(data?.Item?.data).toEqual('idempotent result: bar');
      expect(data?.Item?.status).toEqual('COMPLETED');
      expect(data?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
    });

    const payloadHashSecond = createHash('md5').update('"baq"').digest('base64');
    await ddb.send(new GetCommand({
      TableName: ddbTableNameKeywordArg,
      Key: { id: `${functionNameKeywordArg}#${payloadHashSecond}` }
    })).then((data) => {
      console.log(data);
      expect(data?.Item?.data).toEqual('idempotent result: baq');
      expect(data?.Item?.status).toEqual('COMPLETED');
      expect(data?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
    });
  }, TEST_CASE_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(app, stack);
    }
  }, TEARDOWN_TIMEOUT);
});