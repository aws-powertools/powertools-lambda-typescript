/**
 * Test makeHandlerIdempotent middleware
 *
 * @group e2e/idempotency/makeHandlerIdempotent
 */
import {
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey,
} from '../../../commons/tests/utils/e2eUtils';
import { InvocationLogs } from '../../../commons/tests/utils/InvocationLogs';
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
import { v4 } from 'uuid';
import { App, Stack } from 'aws-cdk-lib';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createHash } from 'node:crypto';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
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
  'makeFnIdempotent'
);
const makeHandlerIdempotentFile = 'makeHandlerIdempotent.test.FunctionCode.ts';

const app = new App();

const ddb = new DynamoDBClient({});
const stack = new Stack(app, stackName);

const testDefault = 'default-sequential';
const functionNameDefault = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  `${testDefault}-fn`
);
const ddbTableNameDefault = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  `${testDefault}-table`
);
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameDefault,
  makeHandlerIdempotentFile,
  functionNameDefault,
  'handler'
);

const testDefaultParallel = 'default-parallel';
const functionNameDefaultParallel = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  `${testDefaultParallel}-fn`
);
const ddbTableNameDefaultParallel = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  `${testDefaultParallel}-table`
);
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameDefaultParallel,
  makeHandlerIdempotentFile,
  functionNameDefaultParallel,
  'handlerParallel'
);

const testTimeout = 'timeout';
const functionNameTimeout = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  `${testTimeout}-fn`
);
const ddbTableNameTimeout = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  `${testTimeout}-table`
);
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameTimeout,
  makeHandlerIdempotentFile,
  functionNameTimeout,
  'handlerTimeout',
  undefined,
  2
);

const testExpired = 'expired';
const functionNameExpired = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  `${testExpired}-fn`
);
const ddbTableNameExpired = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  `${testExpired}-table`
);
createIdempotencyResources(
  stack,
  runtime,
  ddbTableNameExpired,
  makeHandlerIdempotentFile,
  functionNameExpired,
  'handlerExpired',
  undefined,
  2
);

describe(`Idempotency E2E tests, middy middleware usage for runtime ${runtime}`, () => {
  beforeAll(async () => {
    await deployStack(app, stack);
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
      const logs = await invokeFunction(
        functionNameDefault,
        2,
        'SEQUENTIAL',
        payload,
        false
      );
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
      expect(InvocationLogs.parseFunctionLog(functionLogs[0][0])).toEqual(
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
      const logs = await invokeFunction(
        functionNameDefaultParallel,
        2,
        'PARALLEL',
        payload,
        false
      );
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
      const logs = await invokeFunction(
        functionNameTimeout,
        2,
        'SEQUENTIAL',
        payload,
        true
      );
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
      expect(InvocationLogs.parseFunctionLog(functionLogs[1][0])).toEqual(
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
          await invokeFunction(
            functionNameExpired,
            1,
            'SEQUENTIAL',
            { ...payload, invocation: 0 },
            false
          )
        )[0],
      ];
      // Wait for the idempotency record to expire
      await new Promise((resolve) => setTimeout(resolve, 2000));
      logs.push(
        (
          await invokeFunction(
            functionNameExpired,
            1,
            'SEQUENTIAL',
            { ...payload, invocation: 1 },
            false
          )
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
      expect(InvocationLogs.parseFunctionLog(functionLogs[1][0])).toEqual(
        expect.objectContaining({
          message: 'Processed event',
          details: 'bar',
          function_name: functionNameExpired,
        })
      );
      // During the second invocation the handler should be called and complete, so the logs should
      // contain 1 log
      expect(functionLogs[1]).toHaveLength(1);
      expect(InvocationLogs.parseFunctionLog(functionLogs[1][0])).toEqual(
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
    await destroyStack(app, stack);
  }, TEARDOWN_TIMEOUT);
});
