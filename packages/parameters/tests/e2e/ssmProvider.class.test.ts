import { join } from 'node:path';
import {
  TestInvocationLogs,
  TestStack,
  invokeFunctionOnce,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  TestSecureStringParameter,
  TestStringParameter,
} from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

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
 *
 * Test 10
 * store and overwrite a single parameter
 */
describe('Parameters E2E tests, SSM provider', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'SSM',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'ssmProvider.class.test.functionCode.ts'
  );

  // Parameters values
  let paramA: string;
  let paramB: string;
  const paramAValue = 'foo';
  const paramBValue = 'bar';
  const paramCValue = 'baz';
  let paramEncryptedA: string;
  let paramEncryptedB: string;
  const paramEncryptedAValue = 'foo-encrypted';
  const paramEncryptedBValue = 'bar-encrypted';

  let invocationLogs: TestInvocationLogs;

  beforeAll(async () => {
    // Prepare
    const testFunction = new TestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
      },
      {
        nameSuffix: 'SsmProvider',
      }
    );

    // Create SSM parameters
    const parameterGetA = new TestStringParameter(
      testStack,
      {
        stringValue: paramAValue,
      },
      {
        nameSuffix: 'get/a',
      }
    );
    parameterGetA.grantRead(testFunction);
    testFunction.addEnvironment('PARAM_A', parameterGetA.parameterName);
    const parameterGetB = new TestStringParameter(
      testStack,
      {
        stringValue: paramBValue,
      },
      {
        nameSuffix: 'get/b',
      }
    );
    parameterGetB.grantRead(testFunction);
    testFunction.addEnvironment('PARAM_B', parameterGetB.parameterName);

    const parameterEncryptedA = new TestSecureStringParameter(
      testStack,
      {
        value: paramEncryptedAValue,
      },
      {
        nameSuffix: 'secure/a',
      }
    );
    parameterEncryptedA.grantReadData(testFunction);
    testFunction.addEnvironment(
      'PARAM_ENCRYPTED_A',
      parameterEncryptedA.parameterName
    );

    const parameterEncryptedB = new TestSecureStringParameter(
      testStack,
      {
        value: paramEncryptedBValue,
      },
      {
        nameSuffix: 'secure/b',
      }
    );
    parameterEncryptedB.grantReadData(testFunction);
    testFunction.addEnvironment(
      'PARAM_ENCRYPTED_B',
      parameterEncryptedB.parameterName
    );

    const parameterSetC = new TestStringParameter(
      testStack,
      {
        stringValue: paramCValue,
      },
      {
        nameSuffix: 'set/c',
      }
    );
    parameterSetC.grantWrite(testFunction);
    parameterSetC.grantRead(testFunction);
    testFunction.addEnvironment('PARAM_C', parameterSetC.parameterName);

    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    const functionName = testStack.findAndGetStackOutputValue('SsmProvider');
    paramA = testStack.findAndGetStackOutputValue('getaStr');
    paramB = testStack.findAndGetStackOutputValue('getbStr');
    paramEncryptedA = testStack.findAndGetStackOutputValue('secureaSecStr');
    paramEncryptedB = testStack.findAndGetStackOutputValue('securebSecStr');

    // and invoke the Lambda function
    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  });

  describe('SSMProvider usage', () => {
    // Test 1 - get a single parameter by name with default options
    it('should retrieve a single parameter', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[0]);

      expect(testLog).toStrictEqual({
        test: 'get',
        value: paramAValue,
      });
    });

    // Test 2 - get a single parameter by name with decrypt
    it('should retrieve a single parameter with decryption', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[1]);

      expect(testLog).toStrictEqual({
        test: 'get-decrypt',
        value: paramEncryptedAValue,
      });
    });

    // Test 3 - get multiple parameters by path with default options
    it('should retrieve multiple parameters', async () => {
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
    });

    // Test 4 - get multiple parameters by path recursively
    // (aka. get all parameters under a path recursively) i.e.
    // given /param, retrieve /param/get/a and /param/get/b (note path depth)
    it('should retrieve multiple parameters recursively', async () => {
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
    });

    it('should retrieve multiple parameters with decryption', async () => {
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
    });

    // Test 6 - get multiple parameters by name with default options
    it('should retrieve multiple parameters by name', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[5]);

      expect(testLog).toStrictEqual({
        test: 'get-multiple-by-name',
        value: {
          [paramA]: paramAValue,
          [paramB]: paramBValue,
        },
      });
    });

    // Test 7 - get multiple parameters by name, some of them encrypted and some not
    it('should retrieve multiple parameters by name with mixed decryption', async () => {
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
    });

    // Test 8 - get parameter twice with middleware, which counts the number
    // of requests, we check later if we only called SSM API once
    it('should retrieve single parameter cached', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[7]);

      expect(testLog).toStrictEqual({
        test: 'get-cached',
        value: 1,
      });
    });

    // Test 9 - get parameter twice, but force fetch 2nd time,
    // we count number of SDK requests and  check that we made two API calls
    it('should retrieve single parameter twice without caching', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[8]);

      expect(testLog).toStrictEqual({
        test: 'get-forced',
        value: 2,
      });
    });

    // Test 10 - store and overwrite single parameter
    it('should store and overwrite single parameter', async () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[9]);

      expect(testLog).toStrictEqual({
        test: 'set',
        value: 'overwritten',
      });
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
