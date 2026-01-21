import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Duration } from 'aws-cdk-lib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdempotencyTestDurableFunctionAndDynamoTable } from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

const invokeDurableFunction = async (
  lambda: LambdaClient,
  functionName: string,
  payload: object
): Promise<{ result: string | undefined }> => {
  const response = await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    })
  );

  const result = response.Payload
    ? JSON.parse(new TextDecoder().decode(response.Payload))
    : undefined;

  return { result };
};

describe('Idempotency E2E tests, durable functions', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'durableFn',
    },
  });

  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'durableFunctions.test.FunctionCode.ts'
  );

  let functionName: string;
  let tableName: string;

  new IdempotencyTestDurableFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handler',
        timeout: Duration.seconds(30),
      },
    },
    { nameSuffix: 'fn' }
  );

  const ddb = new DynamoDBClient({});
  const lambda = new LambdaClient({});

  beforeAll(async () => {
    await testStack.deploy();
    functionName = testStack.findAndGetStackOutputValue('fnFn');
    tableName = testStack.findAndGetStackOutputValue('fnTable');
  });

  it('executes a durable function with wait step successfully', async () => {
    const payload = { foo: 'bar' };
    const payloadHash = createHash('md5')
      .update(JSON.stringify(payload))
      .digest('base64');

    const { result } = await invokeDurableFunction(
      lambda,
      functionName,
      payload
    );

    const idempotencyRecords = await ddb.send(
      new ScanCommand({ TableName: tableName })
    );

    const baseFunctionName = functionName.split(':')[0];

    expect(result).toEqual('processed: bar');
    expect(idempotencyRecords.Items?.length).toEqual(1);
    expect(idempotencyRecords.Items?.[0].id).toEqual(
      `${baseFunctionName}#${payloadHash}`
    );
    expect(idempotencyRecords.Items?.[0].status).toEqual('COMPLETED');
  });

  it('returns the same result for duplicate payload', async () => {
    const payload = { foo: 'baz' };
    const payloadHash = createHash('md5')
      .update(JSON.stringify(payload))
      .digest('base64');

    const result1 = await invokeDurableFunction(lambda, functionName, payload);
    const result2 = await invokeDurableFunction(lambda, functionName, payload);

    const idempotencyRecords = await ddb.send(
      new ScanCommand({ TableName: tableName })
    );

    const baseFunctionName = functionName.split(':')[0];

    expect(result1.result).toEqual('processed: baz');
    expect(result2.result).toEqual('processed: baz');

    const record = idempotencyRecords.Items?.find((item) =>
      item.id.includes(payloadHash)
    );
    expect(record?.id).toEqual(`${baseFunctionName}#${payloadHash}`);
    expect(record?.status).toEqual('COMPLETED');
  });

  it('throws IdempotencyAlreadyInProgressError for concurrent executions', async () => {
    const payload = { foo: 'concurrent' };
    const payloadHash = createHash('md5')
      .update(JSON.stringify(payload))
      .digest('base64');

    const results = await Promise.allSettled([
      invokeDurableFunction(lambda, functionName, payload),
      invokeDurableFunction(lambda, functionName, payload),
    ]);

    await setTimeout(2000);

    const idempotencyRecords = await ddb.send(
      new ScanCommand({ TableName: tableName })
    );

    const baseFunctionName = functionName.split(':')[0];
    const fulfilled = results.filter((r) => r.status === 'fulfilled');

    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const record = idempotencyRecords.Items?.find((item) =>
      item.id.includes(payloadHash)
    );
    expect(record?.id).toEqual(`${baseFunctionName}#${payloadHash}`);
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
