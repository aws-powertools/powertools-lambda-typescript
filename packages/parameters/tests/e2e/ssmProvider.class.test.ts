/**
 * Test SSMProvider class
 * 
 * @group e2e/parameters/ssm/class
 */
import path from 'path';
import { App, Stack, Aspects } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { v4 } from 'uuid';
import { 
  generateUniqueName, 
  isValidRuntimeKey, 
  createStackWithLambdaFunction, 
  invokeFunction, 
} from '../../../commons/tests/utils/e2eUtils';
import { InvocationLogs } from '../../../commons/tests/utils/InvocationLogs';
import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';
import { ResourceAccessGranter } from '../helpers/cdkAspectGrantAccess';
import { 
  RESOURCE_NAME_PREFIX, 
  SETUP_TIMEOUT, 
  TEARDOWN_TIMEOUT, 
  TEST_CASE_TIMEOUT 
} from './constants';
import {
  createSecureStringProvider,
  createSSMSecureString
} from '../helpers/parametersUtils';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = v4();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'ssmProvider');
const functionName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'ssmProvider');
const lambdaFunctionCodeFile = 'ssmProvider.class.test.functionCode.ts';

const invocationCount = 1;

// Parameter names to be used by Parameters in the Lambda function
const paramA = generateUniqueName(`/${RESOURCE_NAME_PREFIX}`, uuid, runtime, 'param/a');
const paramB = generateUniqueName(`/${RESOURCE_NAME_PREFIX}`, uuid, runtime, 'param/b');
const paramEncryptedA = generateUniqueName(`/${RESOURCE_NAME_PREFIX}`, uuid, runtime, 'param-encrypted/a');
const paramEncryptedB = generateUniqueName(`/${RESOURCE_NAME_PREFIX}`, uuid, runtime, 'param-encrypted/b');

// Parameters values
const paramAValue = 'foo';
const paramBValue = 'bar';
const paramEncryptedAValue = 'foo-encrypted';
const paramEncryptedBValue = 'bar-encrypted';

const integTestApp = new App();
let stack: Stack;

describe(`parameters E2E tests (dynamoDBProvider) for runtime: nodejs18x`, () => {

  let invocationLogs: InvocationLogs[];

  beforeAll(async () => {
    // Create a stack with a Lambda function
    stack = createStackWithLambdaFunction({
      app: integTestApp,
      stackName,
      functionName,
      functionEntry: path.join(__dirname, lambdaFunctionCodeFile),
      environment: {
        UUID: uuid,

        // Values(s) to be used by Parameters in the Lambda function
        PARAM_A: paramA,
        PARAM_B: paramB,
        PARAM_ENCRYPTED_A: paramEncryptedA,
        PARAM_ENCRYPTED_B: paramEncryptedB,
      },
      runtime,
    });

    // Create Custom Resource provider:
    // will be used to create some SSM parameters not supported by CDK
    const provider = createSecureStringProvider({
      stack,
      parametersPrefix: `${RESOURCE_NAME_PREFIX}-${runtime}-${uuid.substring(0,5)}`
    });

    // Create SSM parameters
    const parameterGetA = new StringParameter(stack, 'Param-a', {
      parameterName: paramA,
      stringValue: paramAValue,
    });
    const parameterGetB = new StringParameter(stack, 'Param-b', {
      parameterName: paramB,
      stringValue: paramBValue,
    });

    const parameterEncryptedA = createSSMSecureString({
      stack,
      provider,
      id: 'Param-encrypted-a',
      name: paramEncryptedA,
      value: paramEncryptedAValue,
    });
    
    const parameterEncryptedB = createSSMSecureString({
      stack,
      provider,
      id: 'Param-encrypted-b',
      name: paramEncryptedB,
      value: paramEncryptedBValue,
    });

    // Give the Lambda function access to the SSM parameters
    Aspects.of(stack).add(new ResourceAccessGranter([
      parameterGetA,
      parameterGetB,
      parameterEncryptedA,
      parameterEncryptedB,
    ]));

    // Deploy the stack
    await deployStack(integTestApp, stack);

    // and invoke the Lambda function
    invocationLogs = await invokeFunction(functionName, invocationCount, 'SEQUENTIAL');
    
  }, SETUP_TIMEOUT);

  describe('SSMProvider usage', () => {

    it('should retrieve a single parameter', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[0]);

      expect(testLog).toStrictEqual({
        test: 'get',
        value: paramAValue
      });

    }, TEST_CASE_TIMEOUT);
    
    it('should retrieve a single parameter with decryption', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[1]);

      expect(testLog).toStrictEqual({
        test: 'get-decrypt',
        value: paramEncryptedAValue
      });

    }, TEST_CASE_TIMEOUT);
    
    it('should retrieve multiple parameters', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[2]);
      const expectedParameterNameA = paramA.substring(paramA.lastIndexOf('/') + 1);
      const expectedParameterNameB = paramB.substring(paramB.lastIndexOf('/') + 1);
      
      expect(testLog).toStrictEqual({
        test: 'get-multiple',
        value: {
          [expectedParameterNameA]: paramAValue,
          [expectedParameterNameB]: paramBValue,
        }
      });

    }, TEST_CASE_TIMEOUT);
    
    it('should retrieve multiple parameters recursively', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[3]);
      const expectedParameterNameA = paramA.substring(paramA.lastIndexOf('/') + 1);
      const expectedParameterNameB = paramB.substring(paramB.lastIndexOf('/') + 1);

      expect(testLog).toStrictEqual({
        test: 'get-multiple-recursive',
        value: {
          [expectedParameterNameA]: paramAValue,
          [expectedParameterNameB]: paramBValue,
        }
      });

    }, TEST_CASE_TIMEOUT);
    
    it('should retrieve multiple parameters with decryption', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[4]);
      const expectedParameterNameA = paramEncryptedA.substring(
        paramEncryptedA.lastIndexOf('/') + 1
      );
      const expectedParameterNameB = paramEncryptedB.substring(
        paramEncryptedB.lastIndexOf('/') + 1
      );

      expect(testLog).toStrictEqual({
        test: 'get-multiple-decrypt',
        value: {
          [expectedParameterNameA]: paramEncryptedAValue,
          [expectedParameterNameB]: paramEncryptedBValue,
        }
      });

    }, TEST_CASE_TIMEOUT);
    
    it('should retrieve multiple parameters by name', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[5]);

      expect(testLog).toStrictEqual({
        test: 'get-multiple-by-name',
        value: {
          [paramA]: paramAValue,
          [paramB]: paramBValue,
        }
      });

    }, TEST_CASE_TIMEOUT);
    
    it('should retrieve multiple parameters by name with mixed decryption', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[6]);

      expect(testLog).toStrictEqual({
        test: 'get-multiple-by-name-mixed-decrypt',
        value: {
          [paramEncryptedA]: paramEncryptedAValue,
          [paramEncryptedB]: paramEncryptedBValue,
          [paramA]: paramAValue,
        }
      });

    }, TEST_CASE_TIMEOUT);

  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);

});