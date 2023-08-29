/**
 * Test makeHandlerIdempotent middleware
 *
 * @group e2e/idempotency/makeHandlerIdempotent
 */
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  invokeFunction,
  isValidRuntimeKey,
  TestInvocationLogs,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createIdempotencyResources } from '../helpers/idempotencyUtils';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

const runtime: string = process.env.RUNTIME || defaultRuntime;

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const testName = generateTestUniqueName({
  testPrefix: RESOURCE_NAME_PREFIX,
  runtime,
  testName: 'makeHandlerIdempotent',
});
const testStack = new TestStack(testName);

// Location of the lambda function code
const lambdaFunctionCodeFile = join(
  __dirname,
  'makeHandlerIdempotent.test.FunctionCode.ts'
);

const testDefault = 'default-sequential';
const functionNameDefault = concatenateResourceName({
  testName,
  resourceName: `${testDefault}-fn`,
});
const ddbTableNameDefault = concatenateResourceName({
  testName,
  resourceName: `${testDefault}-table`,
});
createIdempotencyResources(
  testStack.stack,
  runtime,
  ddbTableNameDefault,
  lambdaFunctionCodeFile,
  functionNameDefault,
  'handler'
);

const testDefaultParallel = 'default-parallel';
const functionNameDefaultParallel = concatenateResourceName({
  testName,
  resourceName: `${testDefaultParallel}-fn`,
});
const ddbTableNameDefaultParallel = concatenateResourceName({
  testName,
  resourceName: `${testDefaultParallel}-table`,
});
createIdempotencyResources(
  testStack.stack,
  runtime,
  ddbTableNameDefaultParallel,
  lambdaFunctionCodeFile,
  functionNameDefaultParallel,
  'handlerParallel'
);

const testTimeout = 'timeout';
const functionNameTimeout = concatenateResourceName({
  testName,
  resourceName: `${testTimeout}-fn`,
});
const ddbTableNameTimeout = concatenateResourceName({
  testName,
  resourceName: `${testTimeout}-table`,
});
createIdempotencyResources(
  testStack.stack,
  runtime,
  ddbTableNameTimeout,
  lambdaFunctionCodeFile,
  functionNameTimeout,
  'handlerTimeout',
  undefined,
  2
);

const testExpired = 'expired';
const functionNameExpired = concatenateResourceName({
  testName,
  resourceName: `${testExpired}-fn`,
});
const ddbTableNameExpired = concatenateResourceName({
  testName,
  resourceName: `${testExpired}-table`,
});
createIdempotencyResources(
  testStack.stack,
  runtime,
  ddbTableNameExpired,
  lambdaFunctionCodeFile,
  functionNameExpired,
  'handlerExpired',
  undefined,
  2
);

const ddb = new DynamoDBClient({});

describe(`Idempotency E2E tests, middy middleware usage`, () => {
  beforeAll(async () => {
    await testStack.deploy();
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
          TableName: ddbTableNameDefault,
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
          TableName: ddbTableNameDefaultParallel,
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
          TableName: ddbTableNameTimeout,
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

      // During the first invocation the function should timeout so the logs should contain 2 logs
      expect(functionLogs[0]).toHaveLength(2);
      expect(functionLogs[0][0]).toContain('Task timed out after');
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
          TableName: ddbTableNameExpired,
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
