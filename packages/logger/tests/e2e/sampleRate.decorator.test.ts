import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import {
  invokeFunction,
  TestInvocationLogs,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LoggerTestNodejsFunction } from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX, STACK_OUTPUT_LOG_GROUP } from './constants.js';

describe('Logger E2E tests, sample rate and injectLambdaContext()', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'SampleRate-Decorator',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'sampleRate.decorator.test.FunctionCode.ts'
  );

  const invocationCount = 20;
  const applicationMessage = `Log message ${randomUUID()}`;
  let invocationLogs: TestInvocationLogs[];
  let logGroupName: string;

  beforeAll(async () => {
    // Prepare
    new LoggerTestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        environment: {
          POWERTOOLS_LOG_LEVEL: 'ERROR',
          SAMPLE_RATE: '0.5',
          LOG_MSG: applicationMessage,
        },
      },
      {
        logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
        nameSuffix: 'BasicFeatures',
        outputFormat: 'ESM',
      }
    );

    await testStack.deploy();
    logGroupName = testStack.findAndGetStackOutputValue(STACK_OUTPUT_LOG_GROUP);
    const functionName = testStack.findAndGetStackOutputValue('BasicFeatures');

    invocationLogs = await invokeFunction({
      functionName,
      times: invocationCount,
    });

    console.log('logGroupName', logGroupName);
  });

  describe('Enabling sample rate', () => {
    it('should log all levels based on given sample rate, not just ERROR', () => {
      // Fetch log streams from all invocations
      let countSampled = 0;
      let countNotSampled = 0;

      for (const invocation of invocationLogs) {
        const logs = invocation
          .getFunctionLogs()
          .map(TestInvocationLogs.parseFunctionLog);

        if (logs.length === 1) {
          expect(logs[0]).toMatchObject({
            level: 'ERROR',
            message: applicationMessage,
          });
          countNotSampled++;
          continue;
        }

        const applicationLevels = logs
          .filter((log) => log.message === applicationMessage)
          .map((log) => log.level);
        expect(applicationLevels.sort()).toEqual([
          'DEBUG',
          'ERROR',
          'INFO',
          'WARN',
        ]);
        // Cold-start sampling emits the diagnostic during initialization, before START.
        // Warm-start sampling emits it during the invocation, so it can appear anywhere in the log tail.
        if (logs.length !== 4) {
          expect(logs).toHaveLength(5);
          expect(logs).toContainEqual(
            expect.objectContaining({
              level: 'DEBUG',
              message: 'Setting log level to DEBUG due to sampling rate',
            })
          );
        }
        countSampled++;
      }

      // Given that we set rate to 0.5. The chance that we get all invocationCount sampled
      // (or not sampled) is less than 0.5^20
      expect(countSampled).toBeGreaterThan(0);
      expect(countNotSampled).toBeGreaterThan(0);
    });
  });

  describe('Decorator injectLambdaContext()', () => {
    it('should inject Lambda context into every log emitted', () => {
      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs('ERROR');

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
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
