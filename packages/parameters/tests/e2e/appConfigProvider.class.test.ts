/**
  * Test AppConfigProvider class
  * 
  * @group e2e/parameters/appconfig/class
  */
import path from 'path';
import { App, Stack, Aspects } from 'aws-cdk-lib';
import { toBase64 } from '@aws-sdk/util-base64-node';
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
  createBaseAppConfigResources,
  createAppConfigConfigurationProfile,
} from '../helpers/parametersUtils';

const runtime: string = process.env.RUNTIME || 'nodejs18x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = v4();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'appConfigProvider');
const functionName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'appConfigProvider');
const lambdaFunctionCodeFile = 'appConfigProvider.class.test.functionCode.ts';

const invocationCount = 1;

const applicationName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'app');
const environmentName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'env');
const deploymentStrategyName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'immediate');
const freeFormJsonName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'freeFormJson');
const freeFormYamlName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'freeFormYaml');
const freeFormBase64PlainTextName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'freeFormBase64PlainText');
const featureFlagName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'featureFlag');

const freeFormJsonValue = {
  foo: 'bar',
};
const freeFormYamlValue = `foo: bar
`;
const freeFormPlainTextValue = 'foo';
const featureFlagValue = {
  version: '1',
  flags: {
    myFeatureFlag: {
      'name': 'myFeatureFlag',
    }
  },
  values: {
    myFeatureFlag: {
      enabled: true,
    }
  }
};

const integTestApp = new App();
let stack: Stack;

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
 * 
 * Note: To avoid race conditions, we add a dependency between each pair of configuration profiles.
 * This allows us to influence the order of creation and ensure that each configuration profile
 * is created after the previous one. This is necessary because we share the same AppConfig
 * application and environment for all tests.
 */
describe(`parameters E2E tests (appConfigProvider) for runtime ${runtime}`, () => {

  let invocationLogs: InvocationLogs[];
  const encoder = new TextEncoder();

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
        APPLICATION_NAME: applicationName,
        ENVIRONMENT_NAME: environmentName,
        FREEFORM_JSON_NAME: freeFormJsonName,
        FREEFORM_YAML_NAME: freeFormYamlName,
        FREEFORM_BASE64_ENCODED_PLAIN_TEXT_NAME: freeFormBase64PlainTextName,
        FEATURE_FLAG_NAME: featureFlagName,
      },
      runtime,
    });

    // Create the base resources for an AppConfig application.
    const {
      application,
      environment,
      deploymentStrategy
    } = createBaseAppConfigResources({
      stack,
      applicationName,
      environmentName,
      deploymentStrategyName,
    });

    // Create configuration profiles for tests.
    const freeFormJson = createAppConfigConfigurationProfile({
      stack,
      application,
      environment,
      deploymentStrategy,
      name: freeFormJsonName,
      type: 'AWS.Freeform',
      content: {
        content: JSON.stringify(freeFormJsonValue),
        contentType: 'application/json',
      }
    });

    const freeFormYaml = createAppConfigConfigurationProfile({
      stack,
      application,
      environment,
      deploymentStrategy,
      name: freeFormYamlName,
      type: 'AWS.Freeform',
      content: {
        content: freeFormYamlValue,
        contentType: 'application/x-yaml',
      }
    });
    freeFormYaml.node.addDependency(freeFormJson);

    const freeFormBase64PlainText = createAppConfigConfigurationProfile({
      stack,
      application,
      environment,
      deploymentStrategy,
      name: freeFormBase64PlainTextName,
      type: 'AWS.Freeform',
      content: {
        content: toBase64(new TextEncoder().encode(freeFormPlainTextValue)),
        contentType: 'text/plain',
      }
    });
    freeFormBase64PlainText.node.addDependency(freeFormYaml);

    const featureFlag = createAppConfigConfigurationProfile({
      stack,
      application,
      environment,
      deploymentStrategy,
      name: featureFlagName,
      type: 'AWS.AppConfig.FeatureFlags',
      content: {
        content: JSON.stringify(featureFlagValue),
        contentType: 'application/json',
      }
    });
    featureFlag.node.addDependency(freeFormBase64PlainText);

    // Grant access to the Lambda function to the AppConfig resources.
    Aspects.of(stack).add(new ResourceAccessGranter([
      freeFormJson,
      freeFormYaml,
      freeFormBase64PlainText,
      featureFlag,
    ]));

    // Deploy the stack
    await deployStack(integTestApp, stack);

    // and invoke the Lambda function
    invocationLogs = await invokeFunction(functionName, invocationCount, 'SEQUENTIAL');

  }, SETUP_TIMEOUT);

  describe('AppConfigProvider usage', () => {

    // Test 1 - get a single parameter as-is (no transformation - should return an Uint8Array)
    it('should retrieve single parameter as-is', () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[0]);

      expect(testLog).toStrictEqual({
        test: 'get',
        value: JSON.parse(
          JSON.stringify(
            encoder.encode(freeFormYamlValue)
          )
        ),
      });

    });

    // Test 2 - get a free-form JSON and apply json transformation (should return an object)
    it('should retrieve a free-form JSON parameter with JSON transformation', () => {
      
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[1]);

      expect(testLog).toStrictEqual({
        test: 'get-freeform-json-binary',
        value: freeFormJsonValue,
      });

    });
    
    // Test 3 - get a free-form base64-encoded plain text and apply binary transformation 
    // (should return a decoded string)
    it('should retrieve a base64-encoded plain text parameter with binary transformation', () => {
      
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[2]);

      expect(testLog).toStrictEqual({
        test: 'get-freeform-base64-plaintext-binary',
        value: freeFormPlainTextValue,
      });

    });
    
    // Test 4 - get a feature flag and apply json transformation (should return an object)
    it('should retrieve a feature flag parameter with JSON transformation', () => {
      
      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[3]);

      expect(testLog).toStrictEqual({
        test: 'get-feature-flag-binary',
        value: featureFlagValue.values,
      });

    });
    
    // Test 5 - get parameter twice with middleware, which counts the number
    // of requests, we check later if we only called AppConfig API once
    it('should retrieve single parameter cached', () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[4]);

      expect(testLog).toStrictEqual({
        test: 'get-cached',
        value: 1
      });

    }, TEST_CASE_TIMEOUT);
    
    // Test 6 - get parameter twice, but force fetch 2nd time,
    // we count number of SDK requests and  check that we made two API calls
    it('should retrieve single parameter twice without caching', async () => {

      const logs = invocationLogs[0].getFunctionLogs();
      const testLog = InvocationLogs.parseFunctionLog(logs[5]);

      expect(testLog).toStrictEqual({
        test: 'get-forced',
        value: 2
      });

    }, TEST_CASE_TIMEOUT);

  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);

});