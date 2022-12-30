// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Test logger basic features
 *
 * @group e2e/logger/logEventEnvVarSetting
 */

import path from 'path';
import { App, Stack } from 'aws-cdk-lib';
import { v4 } from 'uuid';
import {
  createStackWithLambdaFunction,
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey
} from '../../../commons/tests/utils/e2eUtils';
import { InvocationLogs } from '../../../commons/tests/utils/InvocationLogs';
import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';
import {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_LOG_GROUP,
  SETUP_TIMEOUT,
  TEST_CASE_TIMEOUT,
  TEARDOWN_TIMEOUT
} from './constants';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = v4();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'LogEventEnvVarSetting-Middy');
const functionName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'LogEventEnvVarSetting-Middy');
const lambdaFunctionCodeFile = 'logEventEnvVarSetting.middy.test.FunctionCode.ts';

const integTestApp = new App();
let logGroupName: string; // We do not know it until deployment
let stack: Stack;

describe(`logger E2E tests log event via env var setting (middy) for runtime: ${runtime}`, () => {

  let invocationLogs: InvocationLogs[];

  beforeAll(async () => {
    // Create and deploy a stack with AWS CDK
    stack = createStackWithLambdaFunction({
      app: integTestApp,
      stackName: stackName,
      functionName: functionName,
      functionEntry: path.join(__dirname, lambdaFunctionCodeFile),
      environment: {
        LOG_LEVEL: 'INFO',
        POWERTOOLS_SERVICE_NAME: 'logger-e2e-testing',
        UUID: uuid,

        // Enabling the logger to log events via env var
        POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      },
      logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
      runtime: runtime,
    });

    const result = await deployStack(integTestApp, stack);
    logGroupName = result.outputs[STACK_OUTPUT_LOG_GROUP];

    // Invoke the function twice (one for cold start, another for warm start)
    invocationLogs = await invokeFunction(functionName, 2, 'SEQUENTIAL');

    console.log('logGroupName', logGroupName);

  }, SETUP_TIMEOUT);

  describe('Log event', () => {

    it('should log the event at both invocations', async () => {
      const firstInvocationMessages = invocationLogs[0].getAllFunctionLogs();
      let eventLoggedInFirstInvocation = false;
      for (const message of firstInvocationMessages) {
        if (message.includes(`event`)) {
          eventLoggedInFirstInvocation = true;
          expect(message).toContain(`"event":{"invocation":0}`);
        }
      }

      const secondInvocationMessages = invocationLogs[1].getAllFunctionLogs();
      let eventLoggedInSecondInvocation = false;
      for (const message of secondInvocationMessages) {
        if (message.includes(`event`)) {
          eventLoggedInSecondInvocation = true;
          expect(message).toContain(`"event":{"invocation":1}`);
        }
      }

      expect(eventLoggedInFirstInvocation).toBe(true);
      expect(eventLoggedInSecondInvocation).toBe(true);

    }, TEST_CASE_TIMEOUT);

  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);
});
