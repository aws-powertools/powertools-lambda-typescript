import { createHash } from 'node:crypto';
import { join } from 'node:path';
/**
 * Test makeHandlerIdempotent middleware
 *
 * @group e2e/idempotency/makeHandlerIdempotent
 */
import {
  TestInvocationLogs,
  TestStack,
  invokeFunction,
} from '@aws-lambda-powertools/testing-utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Duration } from 'aws-cdk-lib';
import { IdempotencyTestNodejsFunctionAndDynamoTable } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants.js';

const ddb = new DynamoDBClient({});

describe('Idempotency E2E tests, middy middleware usage', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'makeHandlerIdempotent',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'makeHandlerIdempotent.test.FunctionCode.ts'
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
    }
  );

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
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
  }, SETUP_TIMEOUT);

  test(
    'when called twice with the same payload, it returns the same result and runs the handler once',
    async () => {
      // Prepare
      const payload = {
        foo: 'bar',
      };
      const payloadHash = createHash('md5')
        .update(JSON.stringify(payload))
        .digest('base64');

      // Act
      const logs = await invokeFunction({
        functionName: functionNameDefault,
        times: 2,
        invocationMode: 'SEQUENTIAL',
        payload,
      });
      const functionLogs = logs.map((log) => log.getFunctionLogs());

      // Assess
      const idempotencyRecords = await ddb.send(
        new ScanCommand({
          TableName: tableNameDefault,
        })
      );
      expect(idempotencyRecords.Items?.length).toEqual(1);
      expect(idempotencyRecords.Items?.[0].id).toEqual(
        `${functionNameDefault}#${payloadHash}`
      );
      expect(idempotencyRecords.Items?.[0].data).toEqual('bar');
      expect(idempotencyRecords.Items?.[0].status).toEqual('COMPLETED');

      // During the first invocation the handler should be called, so the logs should contain 1 log
      expect(functionLogs[0]).toHaveLength(1);
      // We test the content of the log as well as the presence of fields from the context, this
      // ensures that the all the arguments are passed to the handler when made idempotent
      expect(TestInvocationLogs.parseFunctionLog(functionLogs[0][0])).toEqual(
        expect.objectContaining({
          message: 'foo',
          details: 'bar',
          function_name: functionNameDefault,
        })
      );
      // During the second invocation the handler should not be called, so the logs should be empty
      expect(functionLogs[1]).toHaveLength(0);
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when two identical requests are sent in parallel, the handler is called only once',
    async () => {
      // Prepare
      const payload = {
        foo: 'bar',
      };
      const payloadHash = createHash('md5')
        .update(JSON.stringify(payload))
        .digest('base64');

      // Act
      const logs = await invokeFunction({
        functionName: functionNameDefaultParallel,
        times: 2,
        invocationMode: 'PARALLEL',
        payload,
      });
      const functionLogs = logs.map((log) => log.getFunctionLogs());

      // Assess
      const idempotencyRecords = await ddb.send(
        new ScanCommand({
          TableName: tableNameDefaultParallel,
        })
      );
      expect(idempotencyRecords.Items?.length).toEqual(1);
      expect(idempotencyRecords.Items?.[0].id).toEqual(
        `${functionNameDefaultParallel}#${payloadHash}`
      );
      expect(idempotencyRecords.Items?.[0].data).toEqual('bar');
      expect(idempotencyRecords.Items?.[0].status).toEqual('COMPLETED');

      /**
       * Since the requests are sent in parallel we don't know which one will be processed first,
       * however we expect that only on of them will be processed by the handler, while the other
       * one will be rejected with IdempotencyAlreadyInProgressError.
       *
       * We filter the logs to find which one was successful and which one failed, then we check
       * that they contain the expected logs.
       */
      const successfulInvocationLogs = functionLogs.find(
        (functionLog) =>
          functionLog.find((log) => log.includes('Processed event')) !==
          undefined
      );
      const failedInvocationLogs = functionLogs.find(
        (functionLog) =>
          functionLog.find((log) =>
            log.includes('There is already an execution in progress')
          ) !== undefined
      );
      expect(successfulInvocationLogs).toHaveLength(1);
      expect(failedInvocationLogs).toHaveLength(1);
    },
    TEST_CASE_TIMEOUT
  );

  test(
    'when the function times out, the second request is processed correctly by the handler',
    async () => {
      // Prepare
      const payload = {
        foo: 'bar',
      };
      const payloadHash = createHash('md5')
        .update(JSON.stringify(payload.foo))
        .digest('base64');

      // Act
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

      // Assess
      const idempotencyRecords = await ddb.send(
        new ScanCommand({
          TableName: tableNameTimeout,
        })
      );
      expect(idempotencyRecords.Items?.length).toEqual(1);
      expect(idempotencyRecords.Items?.[0].id).toEqual(
        `${functionNameTimeout}#${payloadHash}`
      );
      expect(idempotencyRecords.Items?.[0].data).toEqual({
        ...payload,
        invocation: 1,
      });
      expect(idempotencyRecords.Items?.[0].status).toEqual('COMPLETED');

      try {
        // During the first invocation the handler should be called, so the logs should contain 1 log
        expect(functionLogs[0]).toHaveLength(2);
        expect(functionLogs[0][0]).toContain('Task timed out after');
      } catch {
        // During the first invocation the function should timeout so the logs should not contain any log and the report log should contain a timeout message
        expect(functionLogs[0]).toHaveLength(0);
        expect(logs[0].getReportLog()).toMatch(/Status: timeout$/);
      }

      // During the second invocation the handler should be called and complete, so the logs should
      // contain 1 log
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
      // Prepare
      const payload = {
        foo: 'bar',
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
      const idempotencyRecords = await ddb.send(
        new ScanCommand({
          TableName: tableNameExpired,
        })
      );
      expect(idempotencyRecords.Items?.length).toEqual(1);
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
          details: 'bar',
          function_name: functionNameExpired,
        })
      );
      // During the second invocation the handler should be called and complete, so the logs should
      // contain 1 log
      expect(functionLogs[1]).toHaveLength(1);
      expect(TestInvocationLogs.parseFunctionLog(functionLogs[1][0])).toEqual(
        expect.objectContaining({
          message: 'Processed event',
          details: 'bar',
          function_name: functionNameExpired,
        })
      );
    },
    TEST_CASE_TIMEOUT
  );

  afterAll(async () => {
    await testStack.destroy();
  }, TEARDOWN_TIMEOUT);
});
