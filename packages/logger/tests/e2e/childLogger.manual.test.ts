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
  STACK_OUTPUT_LOG_GROUP,
  commonEnvironmentVars,
} from './constants.js';

describe('Logger E2E tests, child logger', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'ChildLogger-Manual',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'childLogger.manual.test.FunctionCode.ts'
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
      },
      {
        logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
        nameSuffix: 'ChildLogger',
      }
    );

    await testStack.deploy();
    logGroupName = testStack.findAndGetStackOutputValue(STACK_OUTPUT_LOG_GROUP);
    const functionName = testStack.findAndGetStackOutputValue('ChildLogger');

    invocationLogs = await invokeFunction({
      functionName,
      invocationMode: 'SEQUENTIAL',
      times: invocationCount,
    });

    console.log('logGroupName', logGroupName);
  });

  describe('Child logger', () => {
    it('should not log at same level of parent because of its own logLevel', async () => {
      const { PARENT_LOG_MSG: parentLogMsg, CHILD_LOG_MSG: childLogMsg } =
        commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation and filter by level
        const infoLogs = invocationLogs[i].getFunctionLogs('INFO');

        const parentInfoLogs = infoLogs.filter((message) =>
          message.includes(parentLogMsg)
        );
        const childInfoLogs = infoLogs.filter((message) =>
          message.includes(childLogMsg)
        );

        expect(parentInfoLogs).toHaveLength(infoLogs.length);
        expect(childInfoLogs).toHaveLength(0);
      }
    });

    it('should log only level passed to a child', async () => {
      const { CHILD_LOG_MSG: childLogMsg } = commonEnvironmentVars;
      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        // Filter child logs by level
        const errorChildLogs = logMessages.filter(
          (message) =>
            message.includes('ERROR') && message.includes(childLogMsg)
        );

        // Check that the child logger only logged once (the other)
        // log was filtered out by the child logger because of its logLevel
        expect(errorChildLogs).toHaveLength(1);
      }
    });

    it('should NOT inject context into the child logger', async () => {
      const { CHILD_LOG_MSG: childLogMsg } = commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        // Filter child logs by level
        const childLogMessages = logMessages.filter((message) =>
          message.includes(childLogMsg)
        );

        // Check that the context is not present in any of the child logs
        for (const message of childLogMessages) {
          const log = TestInvocationLogs.parseFunctionLog(message);
          expect(log).not.toHaveProperty('function_arn');
          expect(log).not.toHaveProperty('function_memory_size');
          expect(log).not.toHaveProperty('function_name');
          expect(log).not.toHaveProperty('function_request_id');
        }
      }
    });

    it('both logger instances should have the same persistent key/value', async () => {
      const { PERSISTENT_KEY: persistentKey } = commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        // Check that all logs have the persistent key/value
        for (const message of logMessages) {
          const log = TestInvocationLogs.parseFunctionLog(message);
          expect(log).toHaveProperty(persistentKey);
        }
      }
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
