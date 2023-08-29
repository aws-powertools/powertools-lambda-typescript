/**
 * Test SSMProvider class
 *
 * @group e2e/parameters/ssm/class
 */
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  invokeFunctionOnce,
  isValidRuntimeKey,
  TestInvocationLogs,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
} from '@aws-lambda-powertools/testing-utils';
import { Aspects } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { join } from 'node:path';
import { ResourceAccessGranter } from '../helpers/cdkAspectGrantAccess';
import { createSSMSecureString } from '../helpers/parametersUtils';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

/**
 * This test suite deploys a CDK stack with a Lambda function and a number of SSM parameters.
 * The function code uses the Parameters utility to retrieve the SSM parameters.
 * It then logs the values to CloudWatch Logs as JSON objects.
 *
 * Once the stack is deployed, the Lambda function is invoked and the CloudWatch Logs are retrieved.
 * The logs are then parsed and the values are checked against the expected values for each test case.
 *
 * The parameters created are:
 * - Name: param/a - Value: foo
 * - Name: param/b - Value: bar
 * - Name: param-encrypted/a - Value: foo-encrypted
 * - Name: param-encrypted/b - Value: bar-encrypted
 *
 * These parameters allow to retrieve one or more parameters both by name and by path, as well as
 * mixing encrypted and unencrypted parameters.
 *
 * The tests are:
 *
 * Test 1
 * get a single parameter by name with default options
 *
 * Test 2
 * get a single parameter by name with decrypt
 *
 * Test 3
 * get multiple parameters by path with default options
 *
 * Test 4
 * get multiple parameters by path recursively (aka. get all parameters under a path recursively)
 * i.e. given /param, retrieve /param/get/a and /param/get/b (note path depth)
 *
 * Test 5
 * get multiple parameters by path with decrypt
 *
 * Test 6
 * get multiple parameters by name with default options
 *
 * Test 7
 * get multiple parameters by name, some of them encrypted and some not
 *
 * Test 8
 * get parameter twice with middleware, which counts the number of requests,
 * we check later if we only called SSM API once
 *
 * Test 9
 * get parameter twice, but force fetch 2nd time, we count number of SDK requests and
 * check that we made two API calls
 */
describe(`Parameters E2E tests, SSM provider`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'SSMProvider',
  });
  const testStack = new TestStack(testName);

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'ssmProvider.class.test.functionCode.ts'
  );

  const functionName = concatenateResourceName({
    testName,
    resourceName: 'ssmProvider',
  });

  // Parameter names to be used by Parameters in the Lambda function
  const paramA = `/${concatenateResourceName({
    testName,
    resourceName: 'param/a',
  })}`;

  const paramB = `/${concatenateResourceName({
    testName,
    resourceName: 'param/b',
  })}`;

  const paramEncryptedA = `/${concatenateResourceName({
    testName,
    resourceName: 'param-encrypted/a',
  })}`;

  const paramEncryptedB = `/${concatenateResourceName({
    testName,
    resourceName: 'param-encrypted/b',
  })}`;

  // Parameters values
  const paramAValue = 'foo';
  const paramBValue = 'bar';
  const paramEncryptedAValue = 'foo-encrypted';
  const paramEncryptedBValue = 'bar-encrypted';

  let invocationLogs: TestInvocationLogs;

  beforeAll(async () => {
    // Prepare
    new TestNodejsFunction(testStack.stack, functionName, {
      functionName: functionName,
      entry: lambdaFunctionCodeFile,
      runtime: TEST_RUNTIMES[runtime],
      environment: {
        PARAM_A: paramA,
        PARAM_B: paramB,
        PARAM_ENCRYPTED_A: paramEncryptedA,
        PARAM_ENCRYPTED_B: paramEncryptedB,
      },
    });

    // Create SSM parameters
    const parameterGetA = new StringParameter(testStack.stack, 'Param-a', {
      parameterName: paramA,
      stringValue: paramAValue,
    });
    const parameterGetB = new StringParameter(testStack.stack, 'Param-b', {
      parameterName: paramB,
      stringValue: paramBValue,
    });

    const parameterEncryptedA = createSSMSecureString({
      stack: testStack.stack,
      id: 'Param-encrypted-a',
      name: paramEncryptedA,
      value: paramEncryptedAValue,
    });

    const parameterEncryptedB = createSSMSecureString({
      stack: testStack.stack,
      id: 'Param-encrypted-b',
      name: paramEncryptedB,
      value: paramEncryptedBValue,
    });

    // Give the Lambda function access to the SSM parameters
    Aspects.of(testStack.stack).add(
      new ResourceAccessGranter([
        parameterGetA,
        parameterGetB,
        parameterEncryptedA,
        parameterEncryptedB,
      ])
    );

    // Deploy the stack
    await testStack.deploy();

    // and invoke the Lambda function
    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  }, SETUP_TIMEOUT);

  describe('SSMProvider usage', () => {
    // Test 1 - get a single parameter by name with default options
    it(
      'should retrieve a single parameter',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[0]);

        expect(testLog).toStrictEqual({
          test: 'get',
          value: paramAValue,
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 2 - get a single parameter by name with decrypt
    it(
      'should retrieve a single parameter with decryption',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[1]);

        expect(testLog).toStrictEqual({
          test: 'get-decrypt',
          value: paramEncryptedAValue,
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 3 - get multiple parameters by path with default options
    it(
      'should retrieve multiple parameters',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[2]);
        const expectedParameterNameA = paramA.substring(
          paramA.lastIndexOf('/') + 1
        );
        const expectedParameterNameB = paramB.substring(
          paramB.lastIndexOf('/') + 1
        );

        expect(testLog).toStrictEqual({
          test: 'get-multiple',
          value: {
            [expectedParameterNameA]: paramAValue,
            [expectedParameterNameB]: paramBValue,
          },
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 4 - get multiple parameters by path recursively
    // (aka. get all parameters under a path recursively) i.e.
    // given /param, retrieve /param/get/a and /param/get/b (note path depth)
    it(
      'should retrieve multiple parameters recursively',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[3]);
        const expectedParameterNameA = paramA.substring(
          paramA.lastIndexOf('/') + 1
        );
        const expectedParameterNameB = paramB.substring(
          paramB.lastIndexOf('/') + 1
        );

        expect(testLog).toStrictEqual({
          test: 'get-multiple-recursive',
          value: {
            [expectedParameterNameA]: paramAValue,
            [expectedParameterNameB]: paramBValue,
          },
        });
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should retrieve multiple parameters with decryption',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[4]);
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
          },
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 6 - get multiple parameters by name with default options
    it(
      'should retrieve multiple parameters by name',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[5]);

        expect(testLog).toStrictEqual({
          test: 'get-multiple-by-name',
          value: {
            [paramA]: paramAValue,
            [paramB]: paramBValue,
          },
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 7 - get multiple parameters by name, some of them encrypted and some not
    it(
      'should retrieve multiple parameters by name with mixed decryption',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[6]);

        expect(testLog).toStrictEqual({
          test: 'get-multiple-by-name-mixed-decrypt',
          value: {
            [paramEncryptedA]: paramEncryptedAValue,
            [paramEncryptedB]: paramEncryptedBValue,
            [paramA]: paramAValue,
          },
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 8 - get parameter twice with middleware, which counts the number
    // of requests, we check later if we only called SSM API once
    it(
      'should retrieve single parameter cached',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[7]);

        expect(testLog).toStrictEqual({
          test: 'get-cached',
          value: 1,
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 9 - get parameter twice, but force fetch 2nd time,
    // we count number of SDK requests and  check that we made two API calls
    it(
      'should retrieve single parameter twice without caching',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[8]);

        expect(testLog).toStrictEqual({
          test: 'get-forced',
          value: 2,
        });
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
