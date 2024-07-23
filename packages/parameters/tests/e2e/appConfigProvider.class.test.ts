/**
 * Test AppConfigProvider class
 *
 * @group e2e/parameters/appconfig/class
 */
import { join } from 'node:path';
import {
  TestInvocationLogs,
  TestStack,
  invokeFunctionOnce,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { toBase64 } from '@smithy/util-base64';
import { TestAppConfigWithProfiles } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants.js';

/**
 * This test suite deploys a CDK stack with a Lambda function and a number of AppConfig parameters.
 * The function code uses the Parameters utility to retrieve the parameters.
 * It then logs the values to CloudWatch Logs as JSON objects.
 *
 * Once the stack is deployed, the Lambda function is invoked and the CloudWatch Logs are retrieved.
 * The logs are then parsed and the values are checked against the expected values for each test case.
 *
 * The stack creates an AppConfig application and environment, and then creates a number configuration
 * profiles, each with a different type of parameter.
 *
 * The parameters created are:
 * - Free-form JSON
 * - Free-form YAML
 * - Free-form plain text base64-encoded string
 * - Feature flag
 *
 * These parameters allow to retrieve the values and test some transformations.
 *
 * The tests are:
 *
 * Test 1
 * get a single parameter as-is (no transformation - should return an Uint8Array)
 *
 * Test 2
 * get a free-form JSON and apply json transformation (should return an object)
 *
 * Test 3
 * get a free-form base64-encoded plain text and apply binary transformation (should return a decoded string)
 *
 * Test 4
 * get a feature flag and apply json transformation (should return an object)
 *
 * Test 5
 * get parameter twice with middleware, which counts the number of requests,
 * we check later if we only called AppConfig API once
 *
 * Test 6
 * get parameter twice, but force fetch 2nd time, we count number of SDK requests and
 * check that we made two API calls
 * check that we got matching results
 *
 * Test 7
 * get parameter twice, using maxAge to avoid primary cache
 * we count number of SDK requests and check that we made two API calls
 * and check that the values match
 *
 * Note: To avoid race conditions, we add a dependency between each pair of configuration profiles.
 * This allows us to influence the order of creation and ensure that each configuration profile
 * is created after the previous one. This is necessary because we share the same AppConfig
 * application and environment for all tests.
 */
describe('Parameters E2E tests, AppConfig provider', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'AppConfig',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'appConfigProvider.class.test.functionCode.ts'
  );

  const freeFormJsonValue = {
    foo: 'bar',
  };
  const freeFormYamlValue = `foo: bar
`;
  const freeFormPlainTextValue = 'foo';
  const freeFormBase64PlainTextValue = toBase64(
    new TextEncoder().encode(freeFormPlainTextValue)
  );
  const featureFlagValue = {
    version: '1',
    flags: {
      myFeatureFlag: {
        name: 'myFeatureFlag',
      },
    },
    values: {
      myFeatureFlag: {
        enabled: true,
      },
    },
  };

  let invocationLogs: TestInvocationLogs;
  const encoder = new TextEncoder();

  beforeAll(async () => {
    // Prepare
    const testFunction = new TestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
      },
      {
        nameSuffix: 'appConfigProvider',
        outputFormat: 'ESM',
      }
    );

    const appConfigResource = new TestAppConfigWithProfiles(testStack, {
      profiles: [
        {
          nameSuffix: 'freeFormJson',
          type: 'AWS.Freeform',
          content: {
            content: JSON.stringify(freeFormJsonValue),
            contentType: 'application/json',
          },
        },
        {
          nameSuffix: 'freeFormYaml',
          type: 'AWS.Freeform',
          content: {
            content: freeFormYamlValue,
            contentType: 'application/x-yaml',
          },
        },
        {
          nameSuffix: 'freeFormB64Plain',
          type: 'AWS.Freeform',
          content: {
            content: freeFormBase64PlainTextValue,
            contentType: 'text/plain',
          },
        },
        {
          nameSuffix: 'featureFlag',
          type: 'AWS.AppConfig.FeatureFlags',
          content: {
            content: JSON.stringify(featureFlagValue),
            contentType: 'application/json',
          },
        },
      ],
    });
    // Grant read permissions to the function
    appConfigResource.grantReadData(testFunction);
    // Add environment variables containing the resource names to the function
    appConfigResource.addEnvVariablesToFunction(testFunction);

    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    const functionName =
      testStack.findAndGetStackOutputValue('appConfigProvider');

    // and invoke the Lambda function
    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  }, SETUP_TIMEOUT);

  describe('AppConfigProvider usage', () => {
    // Test 1 - get a single parameter as-is (no transformation - should return an Uint8Array)
    it('should retrieve single parameter as-is', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[0]);

      expect(testLog).toStrictEqual({
        test: 'get',
        value: JSON.parse(JSON.stringify(encoder.encode(freeFormYamlValue))),
      });
    });

    // Test 2 - get a free-form JSON and apply json transformation (should return an object)
    it('should retrieve a free-form JSON parameter with JSON transformation', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[1]);

      expect(testLog).toStrictEqual({
        test: 'get-freeform-json-binary',
        value: freeFormJsonValue,
      });
    });

    // Test 3 - get a free-form base64-encoded plain text and apply binary transformation
    // (should return a decoded string)
    it('should retrieve a base64-encoded plain text parameter with binary transformation', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[2]);

      expect(testLog).toStrictEqual({
        test: 'get-freeform-base64-plaintext-binary',
        value: freeFormPlainTextValue,
      });
    });

    // Test 4 - get a feature flag and apply json transformation (should return an object)
    it('should retrieve a feature flag parameter with JSON transformation', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[3]);

      expect(testLog).toStrictEqual({
        test: 'get-feature-flag-binary',
        value: featureFlagValue.values,
      });
    });

    // Test 5 - get parameter twice with middleware, which counts the number
    // of requests, we check later if we only called AppConfig API once
    it(
      'should retrieve single parameter cached',
      () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[4]);

        expect(testLog).toStrictEqual({
          test: 'get-cached',
          value: 1,
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 6 - get parameter twice, but force fetch 2nd time,
    // we count number of SDK requests and  check that we made two API calls
    it(
      'should retrieve single parameter twice without caching',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[5]);

        expect(testLog).toStrictEqual({
          test: 'get-forced',
          value: 2,
        });
      },
      TEST_CASE_TIMEOUT
    );

    // Test 7 - get parameter twice, using maxAge to avoid primary cache
    // we count number of SDK requests and check that we made two API calls
    // and check that the values match
    it(
      'should retrieve single parameter twice, with expiration between and matching values',
      async () => {
        const logs = invocationLogs.getFunctionLogs();
        const testLog = TestInvocationLogs.parseFunctionLog(logs[6]);
        const result = freeFormPlainTextValue;

        expect(testLog).toStrictEqual({
          test: 'get-expired',
          value: {
            counter: 2,
            result1: result,
            result2: result,
          },
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
