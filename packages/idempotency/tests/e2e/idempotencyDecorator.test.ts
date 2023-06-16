/**
 * Test idempotency decorator
 *
 * @group e2e/idempotency
 */
import { v4 } from 'uuid';
import { App, Stack } from 'aws-cdk-lib';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey,
} from '../../../commons/tests/utils/e2eUtils';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';
import {
  deployStack,
  destroyStack,
} from '../../../commons/tests/utils/cdk-cli';
import { LEVEL } from '../../../commons/tests/utils/InvocationLogs';
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'node:crypto';
import { createIdempotencyResources } from '../helpers/idempotencyUtils';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = v4();
const stackName = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'Idempotency'
);
const decoratorFunctionFile = 'idempotencyDecorator.test.FunctionCode.ts';

const app = new App();

const ddb = new DynamoDBClient({ region: 'eu-west-1' });
const stack = new Stack(app, stackName);

const functionNameDefault = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'default'
);
const ddbTableNameDefault = stackName + '-default-table';
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameDefault,
  decoratorFunctionFile,
  functionNameDefault,
  'handler'
);

const functionNameCustom = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'custom'
);
const ddbTableNameCustom = stackName + '-custom-table';
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameCustom,
  decoratorFunctionFile,
  functionNameCustom,
  'handlerCustomized',
  'customId'
);

const functionNameKeywordArg = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'keywordarg'
);
const ddbTableNameKeywordArg = stackName + '-keywordarg-table';
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameKeywordArg,
  decoratorFunctionFile,
  functionNameKeywordArg,
  'handlerWithKeywordArgument'
);

const functionNameFails = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'fails'
);
const ddbTableNameFails = stackName + '-fails-table';
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameFails,
  decoratorFunctionFile,
  functionNameFails,
  'handlerFails'
);

const functionNameOptionalIdempotencyKey = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'optionalIdempotencyKey'
);
const ddbTableNameOptionalIdempotencyKey =
  stackName + '-optional-idempotencyKey-table';
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameOptionalIdempotencyKey,
  decoratorFunctionFile,
  functionNameOptionalIdempotencyKey,
  'handlerWithOptionalIdempoitencyKey'
);
describe('Idempotency e2e test decorator, default settings', () => {
  beforeAll(async () => {
    await deployStack(app, stack);
  }, SETUP_TIMEOUT);

  test(
    'when called twice, it returns the same value without calling the inner function',
    async () => {
      const payload = { foo: 'baz' };
      const payloadHash = createHash('md5')
        .update(JSON.stringify(payload))
        .digest('base64');

      const invocationLogsSequential = await invokeFunction(
        functionNameDefault,
        2,
        'SEQUENTIAL',
        payload,
        false
      );
      // create dynamodb client to query the table and check the value
      const result = await ddb.send(
        new GetCommand({
          TableName: ddbTableNameDefault,
          Key: { id: `${functionNameDefault}#${payloadHash}` },
        })
      );
      expect(result?.Item?.data).toEqual('Hello World');
      expect(result?.Item?.status).toEqual('COMPLETED');
      expect(result?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
      // we log events inside the handler, so the 2nd invocation should not log anything
      expect(
        invocationLogsSequential[0].getFunctionLogs().toString()
      ).toContain('Got test event');
      expect(
        invocationLogsSequential[1].getFunctionLogs().toString()
      ).not.toContain('Got test event');
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when called twice in parallel, it trows an error',
    async () => {
      const payload = { id: '123' };
      const payloadHash = createHash('md5')
        .update(JSON.stringify(payload))
        .digest('base64');
      const invocationLogs = await invokeFunction(
        functionNameDefault,
        2,
        'PARALLEL',
        payload,
        false
      );

      const result = await ddb.send(
        new GetCommand({
          TableName: ddbTableNameDefault,
          Key: { id: `${functionNameDefault}#${payloadHash}` },
        })
      );
      expect(result?.Item?.data).toEqual('Hello World');
      expect(result?.Item?.status).toEqual('COMPLETED');
      expect(result?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
      expect(
        invocationLogs[0].getFunctionLogs(LEVEL.ERROR).toString()
      ).toContain(
        'There is already an execution in progress with idempotency key'
      );
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when called with customized idempotency decorator, it creates ddb entry with custom attributes',
    async () => {
      const payload = { foo: 'baz' };
      const payloadHash = createHash('md5')
        .update(JSON.stringify(payload))
        .digest('base64');

      const invocationLogsCustmozed = await invokeFunction(
        functionNameCustom,
        1,
        'PARALLEL',
        payload,
        false
      );
      const result = await ddb.send(
        new GetCommand({
          TableName: ddbTableNameCustom,
          Key: { customId: `${functionNameCustom}#${payloadHash}` },
        })
      );
      expect(result?.Item?.dataattr).toEqual('Hello World Customized');
      expect(result?.Item?.statusattr).toEqual('COMPLETED');
      expect(result?.Item?.expiryattr).toBeGreaterThan(Date.now() / 1000);
      expect(invocationLogsCustmozed[0].getFunctionLogs().toString()).toContain(
        'Got test event customized'
      );
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when called with a function that fails, it creates ddb entry with error status',
    async () => {
      const payload = { foo: 'baz' };
      const payloadHash = createHash('md5')
        .update(JSON.stringify(payload))
        .digest('base64');

      await invokeFunction(functionNameFails, 1, 'PARALLEL', payload, false);
      const result = await ddb.send(
        new GetCommand({
          TableName: ddbTableNameFails,
          Key: { id: `${functionNameFails}#${payloadHash}` },
        })
      );
      console.log(result);
      expect(result?.Item).toBeUndefined();
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when called with a function that has keyword argument, it creates for every entry of keyword argument',
    async () => {
      const payloadArray = {
        records: [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'baq' },
          { id: 3, foo: 'bar' },
        ],
      };
      const payloadHashFirst = createHash('md5')
        .update('"bar"')
        .digest('base64');

      await invokeFunction(
        functionNameKeywordArg,
        2,
        'SEQUENTIAL',
        payloadArray,
        false
      );
      const resultFirst = await ddb.send(
        new GetCommand({
          TableName: ddbTableNameKeywordArg,
          Key: { id: `${functionNameKeywordArg}#${payloadHashFirst}` },
        })
      );
      console.log(resultFirst);
      expect(resultFirst?.Item?.data).toEqual('idempotent result: bar');
      expect(resultFirst?.Item?.status).toEqual('COMPLETED');
      expect(resultFirst?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);

      const payloadHashSecond = createHash('md5')
        .update('"baq"')
        .digest('base64');
      const resultSecond = await ddb.send(
        new GetCommand({
          TableName: ddbTableNameKeywordArg,
          Key: { id: `${functionNameKeywordArg}#${payloadHashSecond}` },
        })
      );
      console.log(resultSecond);
      expect(resultSecond?.Item?.data).toEqual('idempotent result: baq');
      expect(resultSecond?.Item?.status).toEqual('COMPLETED');
      expect(resultSecond?.Item?.expiration).toBeGreaterThan(Date.now() / 1000);
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when called with a function with optional idempotency key and thorwOnNoIdempotencyKey is false, it does not create ddb entry',
    async () => {
      const payload = { foo: 'baz' }; // we set eventKeyJmesPath: 'idempotencyKey' in the idempotency configuration
      await invokeFunction(
        functionNameOptionalIdempotencyKey,
        2,
        'PARALLEL',
        payload,
        false
      );
      const result = await ddb.send(
        new ScanCommand({
          TableName: ddbTableNameOptionalIdempotencyKey,
        })
      );
      expect(result?.Items).toEqual([]);
    },
    TEST_CASE_TIMEOUT
  );

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(app, stack);
    }
  }, TEARDOWN_TIMEOUT);
});
