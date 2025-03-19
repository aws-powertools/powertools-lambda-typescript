import { join } from 'node:path';
import {
  TestInvocationLogs,
  TestStack,
  invokeFunction,
} from '@aws-lambda-powertools/testing-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LoggerTestNodejsFunction } from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX, STACK_OUTPUT_LOG_GROUP } from './constants.js';

/**
 * In this e2e test for Logger, we test a number of advanced use cases:
 * - Log buffering enabled with flush on error (both manually on logger.error and automatically on uncaught error)
 * - Correlation ID injection (both manually and automatically)
 *
 * The test is split into three cases:
 * - Manual instrumentation
 * - Middy middleware
 * - Decorator
 */
describe('Logger E2E - Advanced uses', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'Advanced',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'advancedUses.test.FunctionCode.ts'
  );

  const invocationCount = 2;
  const invocationLogs = new Map<string, TestInvocationLogs[]>();
  const manualCase = 'Manual';
  const middyCase = 'Middy';
  const decoratorCase = 'Decorator';

  beforeAll(async () => {
    invocationLogs.set(manualCase, []);
    invocationLogs.set(middyCase, []);
    invocationLogs.set(decoratorCase, []);
    for (const caseKey of invocationLogs.keys()) {
      new LoggerTestNodejsFunction(
        testStack,
        {
          entry: lambdaFunctionCodeFilePath,
          handler: `handler${caseKey}`,
        },
        {
          logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
          nameSuffix: caseKey,
          createAlias: true,
        }
      );
    }

    await testStack.deploy();

    for (const caseKey of invocationLogs.keys()) {
      const functionArn = testStack.findAndGetStackOutputValue(caseKey);
      const logs = await invokeFunction({
        functionName: functionArn,
        times: invocationCount,
        invocationMode: 'SEQUENTIAL',
        payload: [
          {
            id: 1,
          },
          {
            id: 2,
          },
        ],
      });
      invocationLogs.set(caseKey, logs);
    }
  });

  it.each([
    {
      caseKey: manualCase,
    },
    {
      caseKey: middyCase,
    },
    {
      caseKey: decoratorCase,
    },
  ])('$caseKey instrumentation', ({ caseKey }) => {
    for (let i = 0; i < invocationCount; i++) {
      const isFirstInvocation = i === 0;
      // Get log messages of the i-th invocation
      const fnLogs = invocationLogs.get(caseKey)?.at(i)?.getFunctionLogs();
      if (!fnLogs || fnLogs.length === 0) {
        throw new Error(`Failed to get logs for ${caseKey} invocation ${i}`);
      }
      // When using decorator & middleware, we are actually throwing an error
      // which is logged by the runtime, so we need to filter out the logs that are
      // not JSON formatted
      const logs = fnLogs.filter((log) => {
        try {
          JSON.parse(log);
          return true;
        } catch (error) {
          return false;
        }
      });

      if (isFirstInvocation) {
        // Logs outside of the function handler are only present on the first invocation
        expect(TestInvocationLogs.parseFunctionLog(logs[0])).toEqual(
          expect.objectContaining({
            level: 'DEBUG',
            message: 'a never buffered debug log',
          })
        );
      }
      // Since we have an extra log (above) on the first invocation, we need to
      // adjust the index of the logs we are checking
      const logIndexOffset = isFirstInvocation ? 1 : 0;
      const correlationId = i + 1;
      expect(
        TestInvocationLogs.parseFunctionLog(logs[0 + logIndexOffset])
      ).toEqual(
        expect.objectContaining({
          level: 'INFO',
          message: 'an info log',
          correlation_id: correlationId,
        })
      );
      expect(
        TestInvocationLogs.parseFunctionLog(logs[1 + logIndexOffset])
      ).toEqual(
        expect.objectContaining({
          level: 'DEBUG',
          message: 'a buffered debug log',
          correlation_id: correlationId,
        })
      );
      expect(
        TestInvocationLogs.parseFunctionLog(logs.at(-1) as string)
      ).toEqual(
        expect.objectContaining({
          level: 'ERROR',
          message: 'Uncaught error detected, flushing log buffer before exit',
          correlation_id: correlationId,
          error: expect.objectContaining({
            name: 'Error',
            message: 'ops',
          }),
        })
      );
    }
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
