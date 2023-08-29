/**
 * Test logger sample rate feature
 *
 * @group e2e/logger/sampleRate
 */
import { join } from 'node:path';
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  invokeFunction,
  isValidRuntimeKey,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
  TestInvocationLogs,
} from '@aws-lambda-powertools/testing-utils';
import {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_LOG_GROUP,
  SETUP_TIMEOUT,
  TEST_CASE_TIMEOUT,
  TEARDOWN_TIMEOUT,
} from './constants';

describe(`Logger E2E tests, sample rate and injectLambdaContext()`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'SampleRate-Decorator',
  });
  const testStack = new TestStack(testName);

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'sampleRate.decorator.test.FunctionCode.ts'
  );

  const fnNameSampleRate = concatenateResourceName({
    testName,
    resourceName: 'SampleRate',
  });

  // Parameters to be used by Logger in the Lambda function
  const LOG_MSG = `Log message ${fnNameSampleRate}`;
  const SAMPLE_RATE = '0.5';
  const LEVEL = TestInvocationLogs.LEVEL;
  const LOG_LEVEL = LEVEL.ERROR;
  let logGroupName: string; // We do not know the exact name until deployment
  let invocationLogs: TestInvocationLogs[];
  const invocations = 20;

  beforeAll(async () => {
    // Prepare
    new TestNodejsFunction(
      testStack.stack,
      fnNameSampleRate,
      {
        functionName: fnNameSampleRate,
        entry: lambdaFunctionCodeFile,
        runtime: TEST_RUNTIMES[runtime],
        environment: {
          LOG_LEVEL: LOG_LEVEL,
          POWERTOOLS_SERVICE_NAME: 'logger-e2e-testing',
          LOG_MSG,
          SAMPLE_RATE,
        },
      },
      {
        logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
      }
    );

    const result = await testStack.deploy();
    logGroupName = result[STACK_OUTPUT_LOG_GROUP];

    invocationLogs = await invokeFunction({
      functionName: fnNameSampleRate,
      times: invocations,
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

        for (let i = 0; i < invocations; i++) {
          // Get log messages of the invocation
          const logMessages = invocationLogs[i].getFunctionLogs();

          if (
            logMessages.length === 1 &&
            logMessages[0].includes(LEVEL.ERROR)
          ) {
            countNotSampled++;
          } else if (logMessages.length === 4) {
            countSampled++;
          } else {
            console.error(`Log group ${logGroupName} contains missing log`);
            throw new Error(
              'Sampled log should have either 1 error log or 4 logs of all levels'
            );
          }
        }

        // Given that we set rate to 0.5. The chance that we get all invocations sampled
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
        for (let i = 0; i < invocations; i++) {
          // Get log messages of the invocation
          const logMessages = invocationLogs[i].getFunctionLogs(LEVEL.ERROR);

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
