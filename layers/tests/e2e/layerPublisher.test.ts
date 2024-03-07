/**
 * Test LayerPublisherStack class
 *
 * @group e2e/layers/all
 */
import { App } from 'aws-cdk-lib';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { LayerPublisherStack } from '../../src/layer-publisher-stack';
import {
  TestStack,
  TestInvocationLogs,
  invokeFunctionOnce,
  generateTestUniqueName,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';
import { join } from 'node:path';
import packageJson from '../../package.json';

jest.spyOn(console, 'log').mockImplementation();

/**
 * This test has two stacks:
 * 1. LayerPublisherStack - publishes a layer version using the LayerPublisher construct and containing the Powertools utilities from the repo
 * 2. TestStack - uses the layer published in the first stack and contains a lambda function that uses the Powertools utilities from the layer
 *
 * The lambda function is invoked once and the logs are collected. The goal of the test is to verify that the layer creation and usage works as expected.
 */
describe(`Layers E2E tests, publisher stack`, () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'functionStack',
    },
  });

  let invocationLogs: TestInvocationLogs;

  const ssmParameterLayerName = generateTestUniqueName({
    testPrefix: `${RESOURCE_NAME_PREFIX}`,
    testName: 'parameter',
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'layerPublisher.class.test.functionCode.ts'
  );

  const powerToolsPackageVersion = packageJson.version;

  const layerApp = new App();
  const layerId = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    testName: 'layerStack',
  });
  const layerStack = new LayerPublisherStack(layerApp, layerId, {
    layerName: layerId,
    powertoolsPackageVersion: powerToolsPackageVersion,
    buildFromLocal: true,
    ssmParameterLayerArn: ssmParameterLayerName,
  });
  const testLayerStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'layerStack',
    },
    app: layerApp,
    stack: layerStack,
  });

  beforeAll(async () => {
    await testLayerStack.deploy();

    const layerVersion = LayerVersion.fromLayerVersionArn(
      testStack.stack,
      'LayerVersionArnReference',
      testLayerStack.findAndGetStackOutputValue('LatestLayerArn')
    );
    new TestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        environment: {
          LAYERS_PATH: '/opt/nodejs/node_modules',
          POWERTOOLS_PACKAGE_VERSION: powerToolsPackageVersion,
          POWERTOOLS_SERVICE_NAME: 'LayerPublisherStack',
        },
        bundling: {
          externalModules: [
            '@aws-lambda-powertools/commons',
            '@aws-lambda-powertools/logger',
            '@aws-lambda-powertools/metrics',
            '@aws-lambda-powertools/tracer',
            '@aws-lambda-powertools/parameter',
            '@aws-lambda-powertools/idempotency',
            '@aws-lambda-powertools/batch',
          ],
        },
        layers: [layerVersion],
      },
      {
        nameSuffix: 'testFn',
      }
    );

    await testStack.deploy();

    const functionName = testStack.findAndGetStackOutputValue('testFn');

    invocationLogs = await invokeFunctionOnce({
      functionName,
    });
  }, SETUP_TIMEOUT);

  describe('package version and path check', () => {
    it(
      'should have no errors in the logs, which indicates the pacakges version matches the expected one',
      () => {
        const logs = invocationLogs.getFunctionLogs('ERROR');

        expect(logs.length).toBe(0);
      },
      TEST_CASE_TIMEOUT
    );
  });

  describe('utilities usage', () => {
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
        const logs = invocationLogs.getFunctionLogs();
        const emfLogEntry = logs.find((log) =>
          log.match(
            /{"_aws":{"Timestamp":\d+,"CloudWatchMetrics":\[\{"Namespace":"\S+","Dimensions":\[\["service"\]\],"Metrics":\[\{"Name":"ColdStart","Unit":"Count"\}\]\}\]},"service":"\S+","ColdStart":1}/
          )
        );

        expect(emfLogEntry).toBeDefined();
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should have one debug log with tracer subsegment info',
      () => {
        const logs = invocationLogs.getFunctionLogs('DEBUG');

        expect(logs.length).toBe(1);
        const logEntry = TestInvocationLogs.parseFunctionLog(logs[0]);
        expect(logEntry.message).toContain('subsegment');
        expect(logEntry.subsegment).toBeDefined();
        const subsegment = JSON.parse(logEntry.subsegment as string);
        const traceIdFromLog = subsegment.trace_id;
        expect(subsegment).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: '### index.handler',
            start_time: expect.any(Number),
            end_time: expect.any(Number),
            type: 'subsegment',
            annotations: {
              ColdStart: true,
            },
            parent_id: expect.any(String),
            trace_id: traceIdFromLog,
          })
        );
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
