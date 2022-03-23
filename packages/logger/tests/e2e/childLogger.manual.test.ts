// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Test logger child logger
 *
 * @group e2e/logger/childLogger
 */

import path from 'path';
import { randomUUID } from 'crypto';
import { App, Stack } from 'aws-cdk-lib';
import { createStackWithLambdaFunction, generateUniqueName, invokeFunction, isValidRuntimeKey } from '../helpers/e2eUtils';
import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';
import { InvocationLogs } from '../helpers/InvocationLogs';

const runtime: string = process.env.RUNTIME || 'nodejs14x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const LEVEL = InvocationLogs.LEVEL;
const TEST_CASE_TIMEOUT = 20000; // 20 seconds
const SETUP_TIMEOUT = 300000; // 300 seconds
const TEARDOWN_TIMEOUT = 200000; 
const STACK_OUTPUT_LOG_GROUP = 'LogGroupName';

const uuid = randomUUID();
const stackName = generateUniqueName(uuid, runtime, 'ChildLogger-Manual');
const functionName = generateUniqueName(uuid, runtime, 'ChildLogger-Manual');
const lambdaFunctionCodeFile = 'childLogger.manual.test.FunctionCode.ts';

// Parameters to be used by Logger in the Lambda function
const PARENT_PERSISTENT_KEY = 'persistentKey';
const PARENT_PERSISTENT_VALUE = `a persistent value that will be put in prent only ${uuid}`;
const PARENT_LOG_MSG = `only PARENT logger will log with this message ${uuid}`;
const CHILD_LOG_MSG = `only CHILD logger will log with this message ${uuid}`;
const CHILD_LOG_LEVEL = LEVEL.ERROR.toString();

const integTestApp = new App();
let logGroupName: string; // We do not know it until deployment
let stack: Stack;
describe(`logger E2E tests child logger functionalities (manual) for runtime: ${runtime}`, () => {

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

        // Text to be used by Logger in the Lambda function
        PARENT_PERSISTENT_KEY, 
        PARENT_PERSISTENT_VALUE, 
        PARENT_LOG_MSG,
        CHILD_LOG_MSG,
        CHILD_LOG_LEVEL,
      },
      logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
      runtime: runtime,
    });
    const result = await deployStack(integTestApp, stack);
    logGroupName = result.outputs[STACK_OUTPUT_LOG_GROUP];

    // Invoke the function once
    invocationLogs = await invokeFunction(functionName, 1);

    console.log('logGroupName', logGroupName);
    
  }, SETUP_TIMEOUT);

  const getAllChildLogs = (): string[] => invocationLogs[0].getFunctionLogs()
    .filter(message => message.includes(CHILD_LOG_MSG));

  describe('Child logger', () => {
    it('should not log at parent log level', async () => {
      // Only parents log will appear at info level
      const allInfoLogs = invocationLogs[0].getFunctionLogs(LEVEL.INFO);
      const parentInfoLogs = allInfoLogs.filter(message => message.includes(PARENT_LOG_MSG));
      const childInfoLogs = allInfoLogs.filter(message => message.includes(CHILD_LOG_MSG));

      expect(parentInfoLogs).toHaveLength(allInfoLogs.length);
      expect(childInfoLogs).toHaveLength(0);
    }, TEST_CASE_TIMEOUT);

    it('should log only level passed to a child', async () => {
      const allChildLogs = getAllChildLogs();
      const errorChildLogs = allChildLogs.filter(message => message.includes(LEVEL.ERROR.toString()));

      expect(errorChildLogs).toHaveLength(allChildLogs.length);
    }, TEST_CASE_TIMEOUT);

    it('should NOT inject context into the child logger', async () => {
      // Only parent has injected context.
      const allChildLogs = getAllChildLogs();

      for ( const log of allChildLogs ) {
        expect(log).not.toContain('function_arn');
        expect(log).not.toContain('function_memory_size');
        expect(log).not.toContain('function_name');
        expect(log).not.toContain('function_request_id');
        expect(log).not.toContain('timestamp');
      }
    }, TEST_CASE_TIMEOUT);

    it('should NOT have parent logger persistent key/value', async () => {
      // Only parent has injected context.
      const allChildLogs = getAllChildLogs();

      for (const log of allChildLogs) {
        expect(log).not.toContain(`"${PARENT_PERSISTENT_KEY}":"${PARENT_PERSISTENT_VALUE}"`);
      }
    }, TEST_CASE_TIMEOUT);
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);
});
