import { join } from 'node:path';
import {
  TestInvocationLogs,
  TestStack,
  invokeFunction,
} from '@aws-lambda-powertools/testing-utils';
import type { APIGatewayAuthorizerResult } from 'aws-lambda';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LoggerTestNodejsFunction } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_LOG_GROUP,
  XRAY_TRACE_ID_REGEX,
  commonEnvironmentVars,
} from './constants.js';

describe('Logger E2E tests, basic functionalities middy usage', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'Basic-Middy',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'basicFeatures.middy.test.FunctionCode.ts'
  );

  const invocationCount = 3;
  let invocationLogs: TestInvocationLogs[];

  beforeAll(async () => {
    // Prepare
    new LoggerTestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
      },
      {
        logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
        nameSuffix: 'BasicFeatures',
        outputFormat: 'ESM',
      }
    );

    await testStack.deploy();
    const logGroupName = testStack.findAndGetStackOutputValue(
      STACK_OUTPUT_LOG_GROUP
    );
    const functionName = testStack.findAndGetStackOutputValue('BasicFeatures');

    // Invoke the function three time (one for cold start, then two for warm start)
    invocationLogs = await invokeFunction({
      functionName,
      times: invocationCount,
      invocationMode: 'SEQUENTIAL',
      payload: {
        foo: 'bar',
      },
    });

    console.log('logGroupName', logGroupName);
  });

  describe('Log level filtering', () => {
    it('should filter log based on POWERTOOLS_LOG_LEVEL (INFO) environment variable in Lambda', async () => {
      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation and filter by level
        const debugLogs = invocationLogs[i].getFunctionLogs('DEBUG');
        // Check that no log message below INFO level is logged
        expect(debugLogs.length).toBe(0);
      }
    });
  });

  describe('Context data', () => {
    it('should inject context info in each log', async () => {
      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
        // Check that the context is logged on every log
        for (const message of logMessages) {
          const log = TestInvocationLogs.parseFunctionLog(message);
          expect(log).toHaveProperty('function_arn');
          expect(log).toHaveProperty('function_memory_size');
          expect(log).toHaveProperty('function_name');
          expect(log).toHaveProperty('function_request_id');
          expect(log).toHaveProperty('timestamp');
        }
      }
    });

    it('should include coldStart equal to TRUE only on the first invocation, FALSE otherwise', async () => {
      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
        // Check that cold start is logged correctly on every log
        for (const message of logMessages) {
          const log = TestInvocationLogs.parseFunctionLog(message);
          if (i === 0) {
            expect(log.cold_start).toBe(true);
          } else {
            expect(log.cold_start).toBe(false);
          }
        }
      }
    });
  });

  it('logs the event for every invocation, only once, and without keys from previous invocations', async () => {
    const { RUNTIME_ADDED_KEY: runtimeAddedKey } = commonEnvironmentVars;

    for (let i = 0; i < invocationCount; i++) {
      // Get log messages of the invocation
      const logMessages = invocationLogs[i].getFunctionLogs();

      const eventLog = logMessages.filter((log) =>
        log.includes('Lambda invocation event')
      );

      // Check that the event log is logged only once
      expect(eventLog).toHaveLength(1);
      const log = TestInvocationLogs.parseFunctionLog(eventLog[0]);
      // Check that the event log is logged correctly
      expect(log).toHaveProperty('event');
      expect(log.event).toStrictEqual(expect.objectContaining({ foo: 'bar' }));
      // Check that the event log does not contain keys from previous invocations
      expect(log).not.toHaveProperty(runtimeAddedKey);
    }
  });

  describe('Persistent additional log keys and values', () => {
    it('should contain persistent value in every log', async () => {
      const {
        PERSISTENT_KEY: persistentKey,
        PERSISTENT_VALUE: persistentValue,
      } = commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        for (const message of logMessages) {
          const log = TestInvocationLogs.parseFunctionLog(message);
          // Check that the persistent key is present in every log
          expect(log).toHaveProperty(persistentKey);
          expect(log[persistentKey]).toBe(persistentValue);
        }
      }
    });

    it('should not contain persistent keys that were removed on runtime', async () => {
      const { REMOVABLE_KEY: removableKey, REMOVABLE_VALUE: removableValue } =
        commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        for (const [index, message] of logMessages.entries()) {
          const log = TestInvocationLogs.parseFunctionLog(message);
          // Check that at the time of logging the event, which happens before the handler,
          // the key was still present
          if (index === 0) {
            expect(log).toHaveProperty(removableKey);
            expect(log[removableKey]).toBe(removableValue);
            // Check that all other logs that happen at runtime do not contain the key
          } else {
            expect(log).not.toHaveProperty(removableValue);
          }
        }
      }
    });
  });

  describe('One-time additional log keys and values', () => {
    it('should log additional keys and value only once', async () => {
      const {
        SINGLE_LOG_ITEM_KEY: singleLogItemKey,
        SINGLE_LOG_ITEM_VALUE: singleLogItemValue,
      } = commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
        // Check that the additional log is logged only once
        const logMessagesWithAdditionalLog = logMessages.filter((log) =>
          log.includes(singleLogItemKey)
        );
        expect(logMessagesWithAdditionalLog).toHaveLength(1);
        // Check that the additional log is logged correctly
        const parsedLog = TestInvocationLogs.parseFunctionLog(
          logMessagesWithAdditionalLog[0]
        );
        expect(parsedLog[singleLogItemKey]).toBe(singleLogItemValue);
      }
    });
  });

  describe('Error logging', () => {
    it('should log error only once', async () => {
      const { ERROR_MSG: errorMsg } = commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation filtered by error level
        const logMessages = invocationLogs[i].getFunctionLogs('ERROR');

        // Check that the error is logged only once
        expect(logMessages).toHaveLength(1);

        // Check that the error is logged correctly
        const errorLog = TestInvocationLogs.parseFunctionLog(logMessages[0]);
        expect(errorLog).toHaveProperty('error');
        expect(errorLog.error).toStrictEqual(
          expect.objectContaining({
            location: expect.any(String),
            name: 'Error',
            message: errorMsg,
            stack: expect.anything(),
          })
        );
      }
    });
  });

  describe('Arbitrary object logging', () => {
    it('should log additional arbitrary object only once', async () => {
      const {
        ARBITRARY_OBJECT_KEY: objectKey,
        ARBITRARY_OBJECT_DATA: objectData,
      } = commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
        // Get the log messages that contains the arbitrary object
        const filteredLogs = logMessages.filter((log) =>
          log.includes(objectData)
        );
        // Check that the arbitrary object is logged only once
        expect(filteredLogs).toHaveLength(1);
        const logObject = TestInvocationLogs.parseFunctionLog(filteredLogs[0]);
        // Check that the arbitrary object is logged correctly
        expect(logObject).toHaveProperty(objectKey);
        const arbitrary = logObject[objectKey] as APIGatewayAuthorizerResult;
        expect(arbitrary.principalId).toBe(objectData);
        expect(arbitrary.policyDocument).toEqual(
          expect.objectContaining({
            Version: 'Version 1',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'geo:*',
                Resource: '*',
              },
            ],
          })
        );
      }
    });
  });

  describe('X-Ray Trace ID injection', () => {
    it('should inject & parse the X-Ray Trace ID of the current invocation into every log', async () => {
      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        // Check that the X-Ray Trace ID is logged on every log
        const traceIds: string[] = [];
        for (const message of logMessages) {
          const log = TestInvocationLogs.parseFunctionLog(message);
          expect(log).toHaveProperty('xray_trace_id');
          expect(log.xray_trace_id).toMatch(XRAY_TRACE_ID_REGEX);
          traceIds.push(log.xray_trace_id as string);
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
