/**
 * Test makeFunctionIdempotent
 *
 * @group e2e/idempotency
 */
import {
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey,
  TEST_RUNTIMES
} from '../../../commons/tests/utils/e2eUtils';
import { RESOURCE_NAME_PREFIX, SETUP_TIMEOUT, TEST_CASE_TIMEOUT } from './constants';
import { v4 } from 'uuid';
import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createHash } from 'node:crypto';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { deployStack } from '../../../commons/tests/utils/cdk-cli';
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'makeFnIdempotent');
const testFunctionName = generateUniqueName(RESOURCE_NAME_PREFIX, v4(), runtime, 'idp-sequential');
const ddbTableName = stackName + '-idempotency-makeFnIdempotent';
const app = new App();
let stack: Stack;

describe('Idempotency e2e test, default settings', () => {
  const ddb = new DynamoDBClient({ region: 'eu-west-1' });

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

    const idempotentFunction = new NodejsFunction(stack, 'IdempotentFucntion', {
      runtime: TEST_RUNTIMES[runtime],
      functionName: testFunctionName,
      entry: path.resolve(__dirname, 'makeFunctionIdempotent.test.FunctionCode.ts'),
      handler: 'handler',
      environment: {
        IDEMPOTENCY_TABLE_NAME: ddbTableName,
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      },
    });

    ddbTable.grantReadWriteData(idempotentFunction);

    await deployStack(app, stack);

    const payload = { records: [ { id: 1, foo: 'bar' }, { id: 2, foo: 'baz' }, { id: 3, foo: 'bar' } ] };
    await invokeFunction(testFunctionName, 2, 'SEQUENTIAL', payload, false);

  }, SETUP_TIMEOUT);

  it('when called twice, it returns the same result', async () => {
    const payloadHashFirst = createHash('md5').update(JSON.stringify('bar')).digest('base64');
    const payloadHashSecond = createHash('md5').update(JSON.stringify('baz')).digest('base64');

    const scanResult = await ddb.send(new ScanCommand({ TableName: ddbTableName }));
    expect(scanResult?.Items?.length).toEqual(2);

    const idempotencyKeyFirst = `${testFunctionName}#${payloadHashFirst}`;
    console.log(idempotencyKeyFirst);
    const resultFirst = await ddb.send(new GetCommand({ TableName: ddbTableName, Key: { id: idempotencyKeyFirst } }));
    console.log(resultFirst);
    expect(resultFirst?.Item?.data).toEqual('Processing done: bar');
    expect(resultFirst?.Item?.status).toEqual('COMPLETED');

    const idempotencyKeySecond = `${testFunctionName}#${payloadHashSecond}`;
    const resultSecond = await ddb.send(new GetCommand({ TableName: ddbTableName, Key: { id: idempotencyKeySecond } }));
    console.log(resultSecond);
    expect(resultSecond?.Item?.data).toEqual('Processing done: baz');
    expect(resultSecond?.Item?.status).toEqual('COMPLETED');

  }, TEST_CASE_TIMEOUT);

});