/**
 * Test logger basic features
 *
 * @group e2e/logger/basicFeatures
 */
import path from 'path';
import { App, Stack } from 'aws-cdk-lib';
import { APIGatewayAuthorizerResult } from 'aws-lambda';
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
  TEARDOWN_TIMEOUT,
  XRAY_TRACE_ID_REGEX,
} from './constants';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const LEVEL = InvocationLogs.LEVEL;

const uuid = v4();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'BasicFeatures-Middy');
const functionName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'BasicFeatures-Middy');
const lambdaFunctionCodeFile = 'basicFeatures.middy.test.FunctionCode.ts';

const invocationCount = 3;

// Text to be used by Logger in the Lambda function
const PERSISTENT_KEY = 'persistentKey';
const RUNTIME_ADDED_KEY = 'invocation';
const PERSISTENT_VALUE = uuid;
const REMOVABLE_KEY = 'removableKey';
const REMOVABLE_VALUE = 'removedValue';
const SINGLE_LOG_ITEM_KEY = 'singleKey';
const SINGLE_LOG_ITEM_VALUE = 'singleValue';
const ERROR_MSG = 'error';
const ARBITRARY_OBJECT_KEY = 'arbitraryObjectKey';
const ARBITRARY_OBJECT_DATA = 'arbitraryObjectData';

const integTestApp = new App();
let logGroupName: string; // We do not know it until deployment
let stack: Stack;

describe(`logger E2E tests basic functionalities (middy) for runtime: ${runtime}`, () => {

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
        PERSISTENT_KEY,
        PERSISTENT_VALUE,
        RUNTIME_ADDED_KEY,
        REMOVABLE_KEY,
        REMOVABLE_VALUE,
        SINGLE_LOG_ITEM_KEY,
        SINGLE_LOG_ITEM_VALUE,
        ERROR_MSG,
        ARBITRARY_OBJECT_KEY,
        ARBITRARY_OBJECT_DATA,
      },
      logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
      runtime: runtime,
    });

    const result = await deployStack(integTestApp, stack);
    logGroupName = result.outputs[STACK_OUTPUT_LOG_GROUP];

    // Invoke the function three time (one for cold start, then two for warm start)
    invocationLogs = await invokeFunction(functionName, invocationCount, 'SEQUENTIAL');

    console.log('logGroupName', logGroupName);

  }, SETUP_TIMEOUT);

  describe('Log level filtering', () => {

    it('should filter log based on LOG_LEVEL (INFO) environment variable in Lambda', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation and filter by level
        const debugLogs = invocationLogs[i].getFunctionLogs(LEVEL.DEBUG);
        // Check that no log message below INFO level is logged
        expect(debugLogs.length).toBe(0);
      }

    }, TEST_CASE_TIMEOUT);
  });

  describe('Context data', () => {

    it('should inject context info in each log', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
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

    }, TEST_CASE_TIMEOUT);

    it('should include coldStart equal to TRUE only on the first invocation, FALSE otherwise', async () => {
      
      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
        // Check that cold start is logged correctly on every log
        for (const message of logMessages) {
          const log = InvocationLogs.parseFunctionLog(message);
          if (i === 0) {
            expect(log.cold_start).toBe(true);
          } else {
            expect(log.cold_start).toBe(false);
          }
        }
      }

    }, TEST_CASE_TIMEOUT);

  });

  describe('Log event', () => {

    it('should log the event as the first log of each invocation only', async () => {
      
      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        for (const [ index, message ] of logMessages.entries()) {
          const log = InvocationLogs.parseFunctionLog(message);
          // Check that the event is logged on the first log
          if (index === 0) {
            expect(log).toHaveProperty('event');
            expect(log.event).toStrictEqual(
              expect.objectContaining({ invocation: i })
            );
          // Check that the event is not logged again on the rest of the logs
          } else {
            expect(log).not.toHaveProperty('event');
          }
        }
      }

    }, TEST_CASE_TIMEOUT);

  });

  describe('Persistent additional log keys and values', () => {

    it('should contain persistent value in every log', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        for (const message of logMessages) {
          const log = InvocationLogs.parseFunctionLog(message);
          // Check that the persistent key is present in every log
          expect(log).toHaveProperty(PERSISTENT_KEY);
          expect(log[PERSISTENT_KEY]).toBe(PERSISTENT_VALUE);
        }
      }
    
    }, TEST_CASE_TIMEOUT);

    it('should not contain persistent keys that were removed on runtime', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        for (const [ index, message ] of logMessages.entries()) {
          const log = InvocationLogs.parseFunctionLog(message);
          // Check that at the time of logging the event, which happens before the handler,
          // the key was still present
          if (index === 0) {
            expect(log).toHaveProperty(REMOVABLE_KEY);
            expect(log[REMOVABLE_KEY]).toBe(REMOVABLE_VALUE);
          // Check that all other logs that happen at runtime do not contain the key
          } else {
            expect(log).not.toHaveProperty(REMOVABLE_KEY);
          }
        }
      }

    }, TEST_CASE_TIMEOUT);

    it('should not leak any persistent keys added runtime since clearState is enabled', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();

        for (const [ index, message ] of logMessages.entries()) {
          const log = InvocationLogs.parseFunctionLog(message);
          // Check that at the time of logging the event, which happens before the handler,
          // the key is NOT present
          if (index === 0) {
            expect(log).not.toHaveProperty(RUNTIME_ADDED_KEY);
          } else {
            // Check that all other logs that happen at runtime do contain the key
            expect(log).toHaveProperty(RUNTIME_ADDED_KEY);
            // Check that the value is the same for all logs (it should be the index of the invocation)
            expect(log[RUNTIME_ADDED_KEY]).toEqual(i);
          }
        }
      }

    }, TEST_CASE_TIMEOUT);
  });

  describe('One-time additional log keys and values', () => {

    it('should log additional keys and value only once', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
        // Check that the additional log is logged only once
        const logMessagesWithAdditionalLog = logMessages.filter(
          log => log.includes(SINGLE_LOG_ITEM_KEY)
        );
        expect(logMessagesWithAdditionalLog).toHaveLength(1);
        // Check that the additional log is logged correctly
        const parsedLog = InvocationLogs
          .parseFunctionLog(logMessagesWithAdditionalLog[0]);
        expect(parsedLog[SINGLE_LOG_ITEM_KEY]).toBe(SINGLE_LOG_ITEM_VALUE);
      }

    }, TEST_CASE_TIMEOUT);

  });

  describe('Error logging', () => {

    it('should log error only once', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation filtered by error level
        const logMessages = invocationLogs[i].getFunctionLogs(LEVEL.ERROR);

        // Check that the error is logged only once
        expect(logMessages).toHaveLength(1);

        // Check that the error is logged correctly
        const errorLog = InvocationLogs.parseFunctionLog(logMessages[0]);
        expect(errorLog).toHaveProperty('error');
        expect(errorLog.error).toStrictEqual(
          expect.objectContaining({
            location: expect.any(String),
            name: 'Error',
            message: ERROR_MSG,
            stack: expect.anything()
          })
        );

      }

    }, TEST_CASE_TIMEOUT);

  });

  describe('Arbitrary object logging', () => {

    it('should log additional arbitrary object only once', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
        // Get the log messages that contains the arbitrary object
        const filteredLogs = logMessages
          .filter(log => log.includes(ARBITRARY_OBJECT_DATA));
        // Check that the arbitrary object is logged only once
        expect(filteredLogs).toHaveLength(1);
        const logObject = InvocationLogs.parseFunctionLog(filteredLogs[0]);
        // Check that the arbitrary object is logged correctly
        expect(logObject).toHaveProperty(ARBITRARY_OBJECT_KEY);
        const arbitrary = logObject[ARBITRARY_OBJECT_KEY] as APIGatewayAuthorizerResult;
        expect(arbitrary.principalId).toBe(ARBITRARY_OBJECT_DATA);
        expect(arbitrary.policyDocument).toEqual(expect.objectContaining(
          {
            Version: 'Version 1',
            Statement: [{
              Effect: 'Allow',
              Action: 'geo:*',
              Resource: '*'
            }]
          }
        ));
      }

    }, TEST_CASE_TIMEOUT);
  });

  describe('X-Ray Trace ID injection', () => {

    it('should inject & parse the X-Ray Trace ID of the current invocation into every log', async () => {

      for (let i = 0; i < invocationCount; i++) {
        // Get log messages of the invocation
        const logMessages = invocationLogs[i].getFunctionLogs();
        
        // Check that the X-Ray Trace ID is logged on every log
        const traceIds: string[] = [];
        for (const message of logMessages) {
          const log = InvocationLogs.parseFunctionLog(message);
          expect(log).toHaveProperty('xray_trace_id');
          expect(log.xray_trace_id).toMatch(XRAY_TRACE_ID_REGEX);
          traceIds.push(log.xray_trace_id as string);
        }
      }

    }, TEST_CASE_TIMEOUT);

  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);
});
