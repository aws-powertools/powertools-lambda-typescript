import { createHash } from 'node:crypto';
import { join } from 'node:path';
import {
  TestInvocationLogs,
  TestStack,
  invokeFunction,
} from '@aws-lambda-powertools/testing-utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Duration } from 'aws-cdk-lib';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdempotencyTestNodejsFunctionAndDynamoTable } from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

const dynamoDBClient = new DynamoDBClient({});

describe('Idempotency e2e test decorator, default settings', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'idempotentDecorator',
    },
  });

  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'idempotentDecorator.test.FunctionCode.ts'
  );

  let functionNameDefault: string;
  let tableNameDefault: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
      },
    },
    {
      nameSuffix: 'default',
    }
  );

  let functionNameDefaultParallel: string;
  let tableNameDefaultParallel: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerParallel',
      },
    },
    {
      nameSuffix: 'defaultParallel',
      outputFormat: 'ESM',
    }
  );

  let functionNameTimeout: string;
  let tableNameTimeout: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerTimeout',
        timeout: Duration.seconds(2),
      },
    },
    {
      nameSuffix: 'timeout',
      outputFormat: 'ESM',
    }
  );

  let functionNameExpired: string;
  let tableNameExpired: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerExpired',
        timeout: Duration.seconds(2),
      },
    },
    {
      nameSuffix: 'expired',
      outputFormat: 'ESM',
    }
  );

  let functionNameDataIndex: string;
  let tableNameDataIndex: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerWithKeywordArgument',
      },
    },
    {
      nameSuffix: 'dataIndex',
      outputFormat: 'ESM',
    }
  );

  let functionCustomConfig: string;
  let tableNameCustomConfig: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerCustomized',
      },
      table: {
        partitionKey: {
          name: 'customId',
          type: AttributeType.STRING,
        },
      },
    },
    {
      nameSuffix: 'customConfig',
      outputFormat: 'ESM',
    }
  );

  beforeAll(async () => {
    await testStack.deploy();

    functionNameDefault = testStack.findAndGetStackOutputValue('defaultFn');
    tableNameDefault = testStack.findAndGetStackOutputValue('defaultTable');

    functionNameDefaultParallel =
      testStack.findAndGetStackOutputValue('defaultParallelFn');
    tableNameDefaultParallel = testStack.findAndGetStackOutputValue(
      'defaultParallelTable'
    );

    functionNameTimeout = testStack.findAndGetStackOutputValue('timeoutFn');
    tableNameTimeout = testStack.findAndGetStackOutputValue('timeoutTable');

    functionNameExpired = testStack.findAndGetStackOutputValue('expiredFn');
    tableNameExpired = testStack.findAndGetStackOutputValue('expiredTable');

    functionCustomConfig =
      testStack.findAndGetStackOutputValue('customConfigFn');
    tableNameCustomConfig =
      testStack.findAndGetStackOutputValue('customConfigTable');

    functionNameDataIndex = testStack.findAndGetStackOutputValue('dataIndexFn');
    tableNameDataIndex = testStack.findAndGetStackOutputValue('dataIndexTable');
  });

  it('returns the same result and runs the handler once when called multiple times', async () => {
    const payload = { foo: 'bar' };

    const payloadHash = createHash('md5')
      .update(JSON.stringify(payload))
      .digest('base64');

    const logs = await invokeFunction({
      functionName: functionNameDefault,
      times: 2,
      invocationMode: 'SEQUENTIAL',
      payload: payload,
    });

    const functionLogs = logs.map((log) => log.getFunctionLogs());

    const idempotencyRecord = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableNameDefault,
      })
    );
    expect(idempotencyRecord.Items).toHaveLength(1);
    expect(idempotencyRecord.Items?.[0].id).toEqual(
      `${functionNameDefault}#${payloadHash}`
    );
    expect(idempotencyRecord.Items?.[0].data).toBeUndefined();
    expect(idempotencyRecord.Items?.[0].status).toEqual('COMPLETED');
    // During the first invocation the handler should be called, so the logs should contain 1 log
    expect(functionLogs[0]).toHaveLength(1);
    // We test the content of the log as well as the presence of fields from the context, this
    // ensures that the all the arguments are passed to the handler when made idempotent
    expect(TestInvocationLogs.parseFunctionLog(functionLogs[0][0])).toEqual(
      expect.objectContaining({
        message: 'Got test event: {"foo":"bar"}',
      })
    );
  });

  it('handles parallel invocations correctly', async () => {
    const payload = { foo: 'bar' };
    const payloadHash = createHash('md5')
      .update(JSON.stringify(payload))
      .digest('base64');
    const logs = await invokeFunction({
      functionName: functionNameDefaultParallel,
      times: 2,
      invocationMode: 'PARALLEL',
      payload: payload,
    });

    const functionLogs = logs.map((log) => log.getFunctionLogs());

    const idempotencyRecords = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableNameDefaultParallel,
      })
    );
    expect(idempotencyRecords.Items).toHaveLength(1);
    expect(idempotencyRecords.Items?.[0].id).toEqual(
      `${functionNameDefaultParallel}#${payloadHash}`
    );
    expect(idempotencyRecords.Items?.[0].data).toEqual('bar');
    expect(idempotencyRecords.Items?.[0].status).toEqual('COMPLETED');
    expect(idempotencyRecords?.Items?.[0].expiration).toBeGreaterThan(
      Date.now() / 1000
    );
    const successfulInvocationLogs = functionLogs.find(
      (functionLog) =>
        functionLog.toString().includes('Processed event') !== undefined
    );

    const failedInvocationLogs = functionLogs.find(
      (functionLog) =>
        functionLog
          .toString()
          .includes('There is already an execution in progres') !== undefined
    );

    expect(successfulInvocationLogs).toBeDefined();
    expect(failedInvocationLogs).toBeDefined();
  });

  it('recovers from a timed out request and processes the next one', async () => {
    const payload = { foo: 'bar' };
    const payloadHash = createHash('md5')
      .update(JSON.stringify(payload.foo))
      .digest('base64');

    const logs = await invokeFunction({
      functionName: functionNameTimeout,
      times: 2,
      invocationMode: 'SEQUENTIAL',
      payload: Array.from({ length: 2 }, (_, index) => ({
        ...payload,
        invocation: index,
      })),
    });
    const functionLogs = logs.map((log) => log.getFunctionLogs());
    const idempotencyRecord = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableNameTimeout,
      })
    );
    expect(idempotencyRecord.Items).toHaveLength(1);
    expect(idempotencyRecord.Items?.[0].id).toEqual(
      `${functionNameTimeout}#${payloadHash}`
    );
    expect(idempotencyRecord.Items?.[0].data).toEqual({
      ...payload,
      invocation: 1,
    });
    expect(idempotencyRecord.Items?.[0].status).toEqual('COMPLETED');

    try {
      // During the first invocation the handler should be called, so the logs should contain 1 log
      expect(functionLogs[0]).toHaveLength(2);
      expect(functionLogs[0][0]).toContain('Task timed out after');
    } catch {
      // During the first invocation the function should timeout so the logs should not contain any log and the report log should contain a timeout message
      expect(functionLogs[0]).toHaveLength(0);
      expect(logs[0].getReportLog()).toMatch(/Status: timeout$/);
    }

    expect(functionLogs[1]).toHaveLength(1);
    expect(TestInvocationLogs.parseFunctionLog(functionLogs[1][0])).toEqual(
      expect.objectContaining({
        message: 'Processed event',
        details: 'bar',
        function_name: functionNameTimeout,
      })
    );
  });

  it('recovers from an expired idempotency record and processes the next request', async () => {
    const payload = {
      foo: 'baz',
    };
    const payloadHash = createHash('md5')
      .update(JSON.stringify(payload.foo))
      .digest('base64');

    // Act
    const logs = [
      (
        await invokeFunction({
          functionName: functionNameExpired,
          times: 1,
          invocationMode: 'SEQUENTIAL',
          payload: { ...payload, invocation: 0 },
        })
      )[0],
    ];
    // Wait for the idempotency record to expire
    await new Promise((resolve) => setTimeout(resolve, 2000));
    logs.push(
      (
        await invokeFunction({
          functionName: functionNameExpired,
          times: 1,
          invocationMode: 'SEQUENTIAL',
          payload: { ...payload, invocation: 1 },
        })
      )[0]
    );
    const functionLogs = logs.map((log) => log.getFunctionLogs());

    // Assess
    const idempotencyRecords = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableNameExpired,
      })
    );
    expect(idempotencyRecords.Items).toHaveLength(1);
    expect(idempotencyRecords.Items?.[0].id).toEqual(
      `${functionNameExpired}#${payloadHash}`
    );
    expect(idempotencyRecords.Items?.[0].data).toEqual({
      ...payload,
      invocation: 1,
    });
    expect(idempotencyRecords.Items?.[0].status).toEqual('COMPLETED');

    // Both invocations should be successful and the logs should contain 1 log each
    expect(functionLogs[0]).toHaveLength(1);
    expect(TestInvocationLogs.parseFunctionLog(functionLogs[1][0])).toEqual(
      expect.objectContaining({
        message: 'Processed event',
        details: 'baz',
        function_name: functionNameExpired,
      })
    );
    // During the second invocation the handler should be called and complete, so the logs should
    // contain 1 log
    expect(functionLogs[1]).toHaveLength(1);
    expect(TestInvocationLogs.parseFunctionLog(functionLogs[1][0])).toEqual(
      expect.objectContaining({
        message: 'Processed event',
        details: 'baz',
        function_name: functionNameExpired,
      })
    );
  });

  it('uses the provided custom idempotency record attributes', async () => {
    const payload = { foo: 'bar' };
    const payloadHash = createHash('md5')
      .update(JSON.stringify(payload))
      .digest('base64');
    const logs = await invokeFunction({
      functionName: functionCustomConfig,
      times: 1,
      invocationMode: 'SEQUENTIAL',
      payload: payload,
    });

    const functionLogs = logs.map((log) => log.getFunctionLogs());

    const idempotencyRecord = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableNameCustomConfig,
      })
    );
    expect(idempotencyRecord.Items?.[0]).toStrictEqual({
      customId: `${functionCustomConfig}#${payloadHash}`,
      dataAttr: 'bar',
      statusAttr: 'COMPLETED',
      expiryAttr: expect.any(Number),
      inProgressExpiryAttr: expect.any(Number),
    });

    expect(functionLogs[0]).toHaveLength(1);
    expect(TestInvocationLogs.parseFunctionLog(functionLogs[0][0])).toEqual(
      expect.objectContaining({
        message: 'Processed event',
        details: 'bar',
      })
    );
  });

  it('takes the data index argument into account when making the function idempotent', async () => {
    const payload = [{ id: '1234' }, { id: '5678' }];
    const payloadHash = createHash('md5')
      .update(JSON.stringify('bar'))
      .digest('base64');

    const logs = await invokeFunction({
      functionName: functionNameDataIndex,
      times: 2,
      invocationMode: 'SEQUENTIAL',
      payload: payload,
    });

    const functionLogs = logs.map((log) => log.getFunctionLogs());

    const idempotencyRecord = await dynamoDBClient.send(
      new ScanCommand({
        TableName: tableNameDataIndex,
      })
    );
    expect(idempotencyRecord.Items).toHaveLength(1);
    expect(idempotencyRecord.Items?.[0].id).toEqual(
      `${functionNameDataIndex}#${payloadHash}`
    );
    expect(idempotencyRecord.Items?.[0].data).toEqual('idempotent result: bar');
    expect(idempotencyRecord.Items?.[0].status).toEqual('COMPLETED');
    // During the first invocation the handler should be called, so the logs should contain 1 log
    expect(functionLogs[0]).toHaveLength(1);
    // We test the content of the log as well as the presence of fields from the context, this
    // ensures that the all the arguments are passed to the handler when made idempotent
    expect(TestInvocationLogs.parseFunctionLog(functionLogs[0][0])).toEqual(
      expect.objectContaining({
        message: 'Got test event',
        id: '1234',
        foo: 'bar',
      })
    );
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
