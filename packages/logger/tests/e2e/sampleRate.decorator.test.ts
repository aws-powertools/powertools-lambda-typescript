/**
 * Test logger sample rate feature
 *
 * @group e2e/logger/sampleRate
 */
import {
  invokeFunction,
  TestInvocationLogs,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { LoggerTestNodejsFunction } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  STACK_OUTPUT_LOG_GROUP,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants.js';

describe(`Logger E2E tests, sample rate and injectLambdaContext()`, () => {
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
          LOG_MSG: `Log message ${randomUUID()}`,
        },
      },
      {
        logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
        nameSuffix: 'BasicFeatures',
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
  }, SETUP_TIMEOUT);

  describe('Enabling sample rate', () => {
    it(
      'should log all levels based on given sample rate, not just ERROR',
      async () => {
        // Fetch log streams from all invocations
        let countSampled = 0;
        let countNotSampled = 0;

        for (let i = 0; i < invocationCount; i++) {
          // Get log messages of the invocation
          const logMessages = invocationLogs[i].getFunctionLogs();

          if (logMessages.length === 1 && logMessages[0].includes('ERROR')) {
            countNotSampled++;
          } else if (
            logMessages.length === 5 &&
            logMessages[0].includes(
              'Setting log level to DEBUG due to sampling rate'
            )
          ) {
            countSampled++;
          } else {
            console.error(`Log group ${logGroupName} contains missing log`);
            throw new Error(
              'Sampled log should have either 1 error log or 4 logs of all levels'
            );
          }
        }

        // Given that we set rate to 0.5. The chance that we get all invocationCount sampled
        // (or not sampled) is less than 0.5^20
        expect(countSampled).toBeGreaterThan(0);
        expect(countNotSampled).toBeGreaterThan(0);
      },
      TEST_CASE_TIMEOUT
    );
  });

  describe('Decorator injectLambdaContext()', () => {
    it(
      'should inject Lambda context into every log emitted',
      async () => {
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
