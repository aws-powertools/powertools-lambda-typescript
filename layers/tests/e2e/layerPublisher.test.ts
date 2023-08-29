/**
 * Test LayerPublisherStack class
 *
 * @group e2e/layers/all
 */
import { App } from 'aws-cdk-lib';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { LayerPublisherStack } from '../../src/layer-publisher-stack';
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  isValidRuntimeKey,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
  TestInvocationLogs,
  invokeFunctionOnce,
} from '@aws-lambda-powertools/testing-utils';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';
import { join } from 'node:path';
import packageJson from '../../package.json';

const runtime: string = process.env.RUNTIME || defaultRuntime;

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key: ${runtime}`);
}

describe(`layers E2E tests (LayerPublisherStack) for runtime: ${runtime}`, () => {
  let invocationLogs: TestInvocationLogs;

  const stackNameLayers = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'layerStack',
  });

  const stackNameFunction = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'functionStack',
  });

  const functionName = concatenateResourceName({
    testName: stackNameFunction,
    resourceName: 'function',
  });

  const ssmParameterLayerName = concatenateResourceName({
    testName: stackNameFunction,
    resourceName: 'parameter',
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'layerPublisher.class.test.functionCode.ts'
  );

  const powerToolsPackageVersion = packageJson.version;
  const layerName = concatenateResourceName({
    testName: stackNameLayers,
    resourceName: 'layer',
  });

  const testStack = new TestStack(stackNameFunction);
  const layerApp = new App();
  const layerStack = new LayerPublisherStack(layerApp, stackNameLayers, {
    layerName,
    powertoolsPackageVersion: powerToolsPackageVersion,
    ssmParameterLayerArn: ssmParameterLayerName,
  });
  const testLayerStack = new TestStack(stackNameLayers, layerApp, layerStack);

  beforeAll(async () => {
    const outputs = await testLayerStack.deploy();

    const layerVersion = LayerVersion.fromLayerVersionArn(
      testStack.stack,
      'LayerVersionArnReference',
      outputs['LatestLayerArn']
    );
    new TestNodejsFunction(testStack.stack, functionName, {
      functionName: functionName,
      entry: lambdaFunctionCodeFile,
      runtime: TEST_RUNTIMES[runtime],
      environment: {
        POWERTOOLS_PACKAGE_VERSION: powerToolsPackageVersion,
        POWERTOOLS_SERVICE_NAME: 'LayerPublisherStack',
      },
      bundling: {
        externalModules: [
          '@aws-lambda-powertools/commons',
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
        ],
      },
      layers: [layerVersion],
    });

    await testStack.deploy();

    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  }, SETUP_TIMEOUT);

  describe('LayerPublisherStack usage', () => {
    it(
      'should have no errors in the logs, which indicates the pacakges version matches the expected one',
      () => {
        const logs = invocationLogs.getFunctionLogs('ERROR');

        expect(logs.length).toBe(0);
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should have one warning related to missing Metrics namespace',
      () => {
        const logs = invocationLogs.getFunctionLogs('WARN');

        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('Namespace should be defined, default used');
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should have one info log related to coldstart metric',
      () => {
        const logs = invocationLogs.getFunctionLogs('INFO');

        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('ColdStart');
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should have one debug log that says Hello World!',
      () => {
        const logs = invocationLogs.getFunctionLogs('DEBUG');

        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('Hello World!');
      },
      TEST_CASE_TIMEOUT
    );
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testLayerStack.destroy();
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
