/**
 * Test logger child logger
 *
 * @group e2e/logger/childLogger
 */
import { join } from 'node:path';
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  isValidRuntimeKey,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
  TestInvocationLogs,
  invokeFunction,
} from '@aws-lambda-powertools/testing-utils';
import {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_LOG_GROUP,
  SETUP_TIMEOUT,
  TEST_CASE_TIMEOUT,
  TEARDOWN_TIMEOUT,
} from './constants';

describe(`Logger E2E tests, child logger`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'ChildLogger-Manual',
  });
  const testStack = new TestStack(testName);

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'childLogger.manual.test.FunctionCode.ts'
  );

  const fnNameChildLogger = concatenateResourceName({
    testName,
    resourceName: 'ChildLogger',
  });

  // Parameters to be used by Logger in the Lambda function
  const PERSISTENT_KEY = 'persistentKey';
  const PERSISTENT_VALUE = 'persistentValue';
  const PARENT_LOG_MSG = 'parent-only-log-msg';
  const CHILD_LOG_MSG = 'child-only-log-msg';
  const LEVEL = TestInvocationLogs.LEVEL;
  const CHILD_LOG_LEVEL = LEVEL.ERROR;
  let logGroupName: string; // We do not know it until deployment
  let invocationLogs: TestInvocationLogs[];
  const invocations = 3;

  beforeAll(async () => {
    // Prepare
    new TestNodejsFunction(
      testStack.stack,
      fnNameChildLogger,
      {
        functionName: fnNameChildLogger,
        entry: lambdaFunctionCodeFile,
        runtime: TEST_RUNTIMES[runtime],
        environment: {
          LOG_LEVEL: 'INFO',
          POWERTOOLS_SERVICE_NAME: 'logger-e2e-testing',
          PERSISTENT_KEY,
          PERSISTENT_VALUE,
          PARENT_LOG_MSG,
          CHILD_LOG_MSG,
          CHILD_LOG_LEVEL,
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
      functionName: fnNameChildLogger,
      invocationMode: 'SEQUENTIAL',
      times: invocations,
    });

    console.log('logGroupName', logGroupName);
  }, SETUP_TIMEOUT);

  describe('Child logger', () => {
    it(
      'should not log at same level of parent because of its own logLevel',
      async () => {
        for (let i = 0; i < invocations; i++) {
          // Get log messages of the invocation and filter by level
          const infoLogs = invocationLogs[i].getFunctionLogs(LEVEL.INFO);

          const parentInfoLogs = infoLogs.filter((message) =>
            message.includes(PARENT_LOG_MSG)
          );
          const childInfoLogs = infoLogs.filter((message) =>
            message.includes(CHILD_LOG_MSG)
          );

          expect(parentInfoLogs).toHaveLength(infoLogs.length);
          expect(childInfoLogs).toHaveLength(0);
        }
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should log only level passed to a child',
      async () => {
        for (let i = 0; i < invocations; i++) {
          // Get log messages of the invocation
          const logMessages = invocationLogs[i].getFunctionLogs();

          // Filter child logs by level
          const errorChildLogs = logMessages.filter(
            (message) =>
              message.includes(LEVEL.ERROR.toString()) &&
              message.includes(CHILD_LOG_MSG)
          );

          // Check that the child logger only logged once (the other)
          // log was filtered out by the child logger because of its logLevel
          expect(errorChildLogs).toHaveLength(1);
        }
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should NOT inject context into the child logger',
      async () => {
        for (let i = 0; i < invocations; i++) {
          // Get log messages of the invocation
          const logMessages = invocationLogs[i].getFunctionLogs();

          // Filter child logs by level
          const childLogMessages = logMessages.filter((message) =>
            message.includes(CHILD_LOG_MSG)
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
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'both logger instances should have the same persistent key/value',
      async () => {
        for (let i = 0; i < invocations; i++) {
          // Get log messages of the invocation
          const logMessages = invocationLogs[i].getFunctionLogs();

          // Check that all logs have the persistent key/value
          for (const message of logMessages) {
            const log = TestInvocationLogs.parseFunctionLog(message);
            expect(log).toHaveProperty(PERSISTENT_KEY);
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
