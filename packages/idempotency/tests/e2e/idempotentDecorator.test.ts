/**
 * Test idempotency decorator
 *
 * @group e2e/idempotency/decorator
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants.js';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'node:crypto';
import {
  invokeFunction,
  TestInvocationLogs,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { IdempotencyTestNodejsFunctionAndDynamoTable } from '../helpers/resources.js';
import { join } from 'node:path';
import { Duration } from 'aws-cdk-lib';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';

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
  }, SETUP_TIMEOUT);

  test(
    'when called twice with the same payload, it returns the same result and runs the handler once',
    async () => {
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
      expect(idempotencyRecord.Items?.[0].data).toEqual('Hello World');
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
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when called twice in parallel, the handler is called only once',
    async () => {
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
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when the function times out, the second request is processed correctly by the handler',
    async () => {
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

      // During the first invocation the handler should be called, so the logs should contain 1 log
      expect(functionLogs[0]).toHaveLength(2);
      expect(functionLogs[0][0]).toContain('Task timed out after');

      expect(functionLogs[1]).toHaveLength(1);
      expect(TestInvocationLogs.parseFunctionLog(functionLogs[1][0])).toEqual(
        expect.objectContaining({
          message: 'Processed event',
          details: 'bar',
          function_name: functionNameTimeout,
        })
      );
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when the idempotency record is expired, the second request is processed correctly by the handler',
    async () => {
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
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when called with customized function wrapper, it creates ddb entry with custom attributes',
    async () => {
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
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when called twice for with different payload using data index arugment, it returns the same result and runs the handler once',
    async () => {
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
      expect(idempotencyRecord.Items?.[0].data).toEqual(
        'idempotent result: bar'
      );
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
    },
    TEST_CASE_TIMEOUT
  );

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
