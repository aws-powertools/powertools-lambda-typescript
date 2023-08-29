/**
 * Test logger basic features
 *
 * @group e2e/logger/logEventEnvVarSetting
 */
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  invokeFunction,
  isValidRuntimeKey,
  TestInvocationLogs,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
} from '@aws-lambda-powertools/testing-utils';
import { join } from 'node:path';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  STACK_OUTPUT_LOG_GROUP,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

describe(`Logger E2E tests, log event via env var setting with middy`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'LogEventEnvVarSetting-Middy',
  });
  const testStack = new TestStack(testName);

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'logEventEnvVarSetting.middy.test.FunctionCode.ts'
  );

  const fnNameLogEventEnvVar = concatenateResourceName({
    testName,
    resourceName: 'LogEvent',
  });

  let logGroupName: string; // We do not know it until deployment

  let invocationLogs: TestInvocationLogs[];
  const invocations = 3;

  beforeAll(async () => {
    // Prepare
    new TestNodejsFunction(
      testStack.stack,
      fnNameLogEventEnvVar,
      {
        functionName: fnNameLogEventEnvVar,
        entry: lambdaFunctionCodeFile,
        runtime: TEST_RUNTIMES[runtime],
        environment: {
          LOG_LEVEL: 'INFO',
          POWERTOOLS_SERVICE_NAME: 'logger-e2e-testing',
          POWERTOOLS_LOGGER_LOG_EVENT: 'true',
        },
      },
      {
        logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
      }
    );

    const result = await testStack.deploy();
    logGroupName = result[STACK_OUTPUT_LOG_GROUP];

    // Invoke the function three time (one for cold start, then two for warm start)
    invocationLogs = await invokeFunction({
      functionName: fnNameLogEventEnvVar,
      invocationMode: 'SEQUENTIAL',
      times: invocations,
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
        for (let i = 0; i < invocations; i++) {
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
