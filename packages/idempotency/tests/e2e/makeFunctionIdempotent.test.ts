/**
 * Test makeFunctionIdempotent
 *
 * @group e2e/idempotency
 */
import { generateUniqueName, invokeFunction, isValidRuntimeKey } from '../../../commons/tests/utils/e2eUtils';
import { RESOURCE_NAME_PREFIX, SETUP_TIMEOUT, TEARDOWN_TIMEOUT, TEST_CASE_TIMEOUT } from './constants';
import { v4 } from 'uuid';
import { App, Stack } from 'aws-cdk-lib';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createHash } from 'node:crypto';
import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { createIdempotencyResources } from '../helpers/idempotencyUtils';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}
const uuid = v4();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'makeFnIdempotent');
const makeFunctionIdepmpotentFile = 'makeFunctionIdempotent.test.FunctionCode.ts';

const app = new App();
let stack: Stack;

describe('Idempotency e2e test, default settings', () => {
  const ddb = new DynamoDBClient({ region: 'eu-west-1' });
  stack = new Stack(app, stackName);

  const functionNameDefault = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'default');
  const ddbTableNameDefault = stackName + '-default-table';
  createIdempotencyResources(stack, runtime, ddbTableNameDefault, makeFunctionIdepmpotentFile, functionNameDefault, 'handler');

  const functionNameCustom = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'custom');
  const ddbTableNameCustom = stackName + '-custom-table';
  createIdempotencyResources(stack, runtime, ddbTableNameCustom, makeFunctionIdepmpotentFile, functionNameCustom, 'handlerCustomized', 'customId');

  const functionNameKeywordArg = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'keywordarg');
  const ddbTableNameKeywordArg = stackName + '-keywordarg-table';
  createIdempotencyResources(stack, runtime, ddbTableNameKeywordArg, makeFunctionIdepmpotentFile, functionNameKeywordArg, 'handlerWithKeywordArgument');

  beforeAll(async () => {

    await deployStack(app, stack);

  }, SETUP_TIMEOUT);

  it('when called twice, it returns the same result', async () => {
    const payload = { records: [ { id: 1, foo: 'bar' }, { id: 2, foo: 'baz' }, { id: 3, foo: 'bar' } ] };
    await invokeFunction(functionNameDefault, 2, 'SEQUENTIAL', payload, false);

    const payloadHashFirst = createHash('md5').update(JSON.stringify('bar')).digest('base64');
    const payloadHashSecond = createHash('md5').update(JSON.stringify('baz')).digest('base64');

    await ddb.send(new ScanCommand({ TableName: ddbTableNameDefault })).then((result) => {
      expect(result?.Items?.length).toEqual(2);
    });

    await ddb.send(new GetCommand({
      TableName: ddbTableNameDefault,
      Key: { id: `${functionNameDefault}#${payloadHashFirst}` }
    })).then((result) => {
      expect(result?.Item?.data).toEqual('Processing done: bar');
      expect(result?.Item?.status).toEqual('COMPLETED');

    });

    await ddb.send(new GetCommand({
      TableName: ddbTableNameDefault,
      Key: { id: `${functionNameDefault}#${payloadHashSecond}` }
    })).then((result) => {
      expect(result?.Item?.data).toEqual('Processing done: baz');
      expect(result?.Item?.status).toEqual('COMPLETED');
    });

  }, TEST_CASE_TIMEOUT);

  test('when called with customized function wrapper, it creates ddb entry with custom attributes', async () => {
    const payload = { records: [ { id: 1, foo: 'bar' }, { id: 2, foo: 'baq' }, { id: 3, foo: 'bar' } ] };
    const payloadHash = createHash('md5').update('"bar"').digest('base64');

    const invocationLogsCustmozed = await invokeFunction(functionNameCustom, 2, 'SEQUENTIAL', payload, false);
    await ddb.send(new GetCommand({
      TableName: ddbTableNameCustom,
      Key: { customId: `${functionNameCustom}#${payloadHash}` }
    })).then((data) => {
      console.log(data);
      expect(data?.Item?.dataattr).toEqual('Processing done: bar');
      expect(data?.Item?.statusattr).toEqual('COMPLETED');
      expect(data?.Item?.expiryattr).toBeGreaterThan(Date.now() / 1000);
      expect(invocationLogsCustmozed[0].getFunctionLogs().toString()).toContain('Got test event');
    });
  }, TEST_CASE_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(app, stack);
    }
  }, TEARDOWN_TIMEOUT);
});