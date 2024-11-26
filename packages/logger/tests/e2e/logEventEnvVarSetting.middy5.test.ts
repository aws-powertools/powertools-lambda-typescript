import { join } from 'node:path';
import {
  TestInvocationLogs,
  TestStack,
  invokeFunction,
} from '@aws-lambda-powertools/testing-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LoggerTestNodejsFunction } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  STACK_OUTPUT_LOG_GROUP,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants.js';

describe('Logger E2E tests, log event via env var setting with middy', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'LogEventFromEnv-Middy',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'logEventEnvVarSetting.middy5.test.FunctionCode.ts'
  );

  const invocationCount = 3;
  let invocationLogs: TestInvocationLogs[];
  let logGroupName: string;

  beforeAll(async () => {
    // Prepare
    new LoggerTestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        environment: {
          POWERTOOLS_LOGGER_LOG_EVENT: 'true',
        },
      },
      {
        logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
        nameSuffix: 'LogEventFromEnv',
      }
    );

    await testStack.deploy();
    logGroupName = testStack.findAndGetStackOutputValue(STACK_OUTPUT_LOG_GROUP);
    const functionName =
      testStack.findAndGetStackOutputValue('LogEventFromEnv');

    invocationLogs = await invokeFunction({
      functionName,
      invocationMode: 'SEQUENTIAL',
      times: invocationCount,
      payload: {
        foo: 'bar',
      },
    });

    console.log('logGroupName', logGroupName);
  }, SETUP_TIMEOUT);

  describe('Log event', () => {
    it(
      'should log the event as the first log of each invocation only',
      async () => {
        for (let i = 0; i < invocationCount; i++) {
          // Get log messages of the invocation
          const logMessages = invocationLogs[i].getFunctionLogs();

          for (const [index, message] of logMessages.entries()) {
            const log = TestInvocationLogs.parseFunctionLog(message);
            // Check that the event is logged on the first log
            if (index === 0) {
              expect(log).toHaveProperty('event');
              expect(log.event).toStrictEqual(
                expect.objectContaining({ foo: 'bar' })
              );
              // Check that the event is not logged again on the rest of the logs
            } else {
              expect(log).not.toHaveProperty('event');
            }
          }
        }
      },
      TEST_CASE_TIMEOUT
    );
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
