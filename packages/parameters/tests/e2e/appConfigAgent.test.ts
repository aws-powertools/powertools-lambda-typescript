import { join } from 'node:path';
import {
  getArchitectureKey,
  invokeFunctionOnce,
  TestInvocationLogs,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { toBase64 } from '@smithy/util-base64';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TestAppConfigWithProfiles } from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

/**
 * ARNs of the AWS AppConfig Agent Lambda extension layer, see:
 * https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions-versions.html
 *
 * The layer publisher account ID differs per region, so we keep a map of the regions
 * where we run the end-to-end tests.
 */
const appConfigAgentLayerArns: Record<string, Record<string, string>> = {
  'us-east-1': {
    x86_64:
      'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension:328',
    arm64:
      'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension-Arm64:261',
  },
  'eu-west-1': {
    x86_64:
      'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension:305',
    arm64:
      'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension-Arm64:243',
  },
};

const getAppConfigAgentLayerArn = (): string => {
  const region = process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION;
  const layerArn = region
    ? appConfigAgentLayerArns[region]?.[getArchitectureKey()]
    : undefined;
  if (!layerArn) {
    throw new Error(
      `No AppConfig Agent Lambda extension layer ARN known for region '${region}' and architecture '${getArchitectureKey()}'`
    );
  }

  return layerArn;
};

/**
 * This test suite deploys a CDK stack with a Lambda function that has the AWS AppConfig Agent
 * Lambda extension layer attached, plus a number of AppConfig configuration profiles.
 * The function code uses the `getConfig` function from the `appconfig-agent` module to retrieve
 * the configurations from the agent's local HTTP endpoint and logs the values to CloudWatch Logs
 * as JSON objects.
 *
 * Once the stack is deployed, the Lambda function is invoked and the CloudWatch Logs are retrieved.
 * The logs are then parsed and the values are checked against the expected values for each test case.
 *
 * The configuration profiles created are:
 * - Free-form JSON
 * - Free-form YAML
 * - Free-form plain text base64-encoded string
 * - Feature flag
 *
 * The tests are:
 *
 * Test 1
 * get a configuration as-is (no transformation - should return a string)
 *
 * Test 2
 * get a free-form JSON and apply json transformation (should return an object)
 *
 * Test 3
 * get a free-form base64-encoded plain text and apply binary transformation (should return a decoded string)
 *
 * Test 4
 * get a feature flag (agent returns the evaluated flag values) and apply json transformation (should return an object)
 *
 * Test 5
 * get a configuration that does not exist (should throw a GetParameterError)
 */
describe('Parameters E2E tests, AppConfig Agent', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'AppConfigAgent',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'appConfigAgent.test.functionCode.ts'
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

  beforeAll(async () => {
    // Prepare
    const testFunction = new TestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        layers: [
          LayerVersion.fromLayerVersionArn(
            testStack.stack,
            'appConfigAgentLayer',
            getAppConfigAgentLayerArn()
          ),
        ],
      },
      {
        nameSuffix: 'appConfigAgent',
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
    const functionName = testStack.findAndGetStackOutputValue('appConfigAgent');

    // and invoke the Lambda function
    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  });

  describe('getConfig usage', () => {
    // Test 1 - get a configuration as-is (no transformation - should return a string)
    it('retrieves a single configuration as-is', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[0]);

      expect(testLog).toStrictEqual({
        test: 'get',
        value: freeFormYamlValue,
      });
    });

    // Test 2 - get a free-form JSON and apply json transformation (should return an object)
    it('retrieves a free-form JSON configuration with JSON transformation', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[1]);

      expect(testLog).toStrictEqual({
        test: 'get-freeform-json',
        value: freeFormJsonValue,
      });
    });

    // Test 3 - get a free-form base64-encoded plain text and apply binary transformation
    // (should return a decoded string)
    it('retrieves a base64-encoded plain text configuration with binary transformation', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[2]);

      expect(testLog).toStrictEqual({
        test: 'get-freeform-base64-plaintext-binary',
        value: freeFormPlainTextValue,
      });
    });

    // Test 4 - get a feature flag and apply json transformation (should return an object
    // with the evaluated flag values)
    it('retrieves a feature flag configuration with JSON transformation', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[3]);

      expect(testLog).toStrictEqual({
        test: 'get-feature-flag',
        value: featureFlagValue.values,
      });
    });

    // Test 5 - get a configuration that does not exist (should throw a GetParameterError)
    it('throws a GetParameterError when the configuration does not exist', () => {
      const logs = invocationLogs.getFunctionLogs();
      const testLog = TestInvocationLogs.parseFunctionLog(logs[4]);

      expect(testLog).toStrictEqual({
        test: 'get-missing',
        error: 'GetParameterError',
      });
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
