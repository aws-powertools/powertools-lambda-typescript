/**
 * Test logger sample rate feature
 *
 * @group e2e/logger/sampleRate
 */
import path from 'path';
import { App, Stack } from 'aws-cdk-lib';
import { v4 } from 'uuid';
import {
  createStackWithLambdaFunction,
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey,
} from '../../../commons/tests/utils/e2eUtils';
import { InvocationLogs } from '../../../commons/tests/utils/InvocationLogs';
import {
  deployStack,
  destroyStack,
} from '../../../commons/tests/utils/cdk-cli';
import {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_LOG_GROUP,
  SETUP_TIMEOUT,
  TEST_CASE_TIMEOUT,
  TEARDOWN_TIMEOUT,
} from './constants';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const LEVEL = InvocationLogs.LEVEL;

const uuid = v4();
const stackName = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'SampleRate-Decorator'
);
const functionName = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuid,
  runtime,
  'SampleRate-Decorator'
);
const lambdaFunctionCodeFile = 'sampleRate.decorator.test.FunctionCode.ts';

const invocationCount = 20;

// Parameters to be used by Logger in the Lambda function
const LOG_MSG = `Log message ${uuid}`;
const SAMPLE_RATE = '0.5';
const LOG_LEVEL = LEVEL.ERROR;

const integTestApp = new App();
let stack: Stack;
let logGroupName: string; // We do not know the exact name until deployment

describe(`logger E2E tests sample rate and injectLambdaContext() for runtime: nodejs18x`, () => {
  let invocationLogs: InvocationLogs[];

  beforeAll(async () => {
    // Create and deploy a stack with AWS CDK
    stack = createStackWithLambdaFunction({
      app: integTestApp,
      stackName: stackName,
      functionName: functionName,
      functionEntry: path.join(__dirname, lambdaFunctionCodeFile),
      environment: {
        LOG_LEVEL: LOG_LEVEL,
        POWERTOOLS_SERVICE_NAME: 'logger-e2e-testing',
        UUID: uuid,

        // Parameter(s) to be used by Logger in the Lambda function
        LOG_MSG,
        SAMPLE_RATE,
      },
      logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
      runtime: runtime,
    });
    const result = await deployStack(integTestApp, stack);
    logGroupName = result.outputs[STACK_OUTPUT_LOG_GROUP];

    invocationLogs = await invokeFunction(functionName, invocationCount);

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
        for (let i = 0; i < invocationCount; i++) {
          // Get log messages of the invocation
          const logMessages = invocationLogs[i].getFunctionLogs(LEVEL.ERROR);

          // Check that the context is logged on every log
          for (const message of logMessages) {
            const log = InvocationLogs.parseFunctionLog(message);
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
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);
});
