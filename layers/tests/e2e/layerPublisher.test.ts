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
  getRuntimeKey,
} from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
} from './constants';
import { join } from 'node:path';
import packageJson from '../../package.json';

jest.spyOn(console, 'log').mockImplementation();

// eslint-disable-next-line func-style -- type assertions can't be arrow functions
function assertLogs(
  logs: TestInvocationLogs | undefined
): asserts logs is TestInvocationLogs {
  if (!logs) {
    throw new Error('Function logs are not available');
  }
}

/**
 * This test has two stacks:
 * 1. LayerPublisherStack - publishes a layer version using the LayerPublisher construct and containing the Powertools utilities from the repo
 * 2. TestStack - uses the layer published in the first stack and contains two lambda functions that use the Powertools utilities from the layer
 *
 * The lambda function is invoked once and the logs are collected. The goal of the test is to verify that the layer creation and usage works as expected.
 */
describe(`Layers E2E tests`, () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'functionStack',
    },
  });

  /**
   * Node.js 16.x does not support importing ESM modules from Lambda Layers reliably.
   *
   * The feature is available in Node.js 18.x and later.
   * @see https://aws.amazon.com/blogs/compute/node-js-18-x-runtime-now-available-in-aws-lambda/
   */
  const cases = getRuntimeKey() === 'nodejs16x' ? ['CJS'] : ['CJS', 'ESM'];
  const invocationLogsMap: Map<(typeof cases)[number], TestInvocationLogs> =
    new Map();

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
    // Deploy the stack that publishes the layer
    await testLayerStack.deploy();

    // Import the layer version from the stack outputs into the test stack
    const layerVersion = LayerVersion.fromLayerVersionArn(
      testStack.stack,
      'LayerVersionArnReference',
      testLayerStack.findAndGetStackOutputValue('LatestLayerArn')
    );

    // Add a lambda function for each output format to the test stack
    cases.forEach((outputFormat) => {
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
              '@aws-lambda-powertools/*',
              '@aws-sdk/*',
              'aws-xray-sdk-node',
            ],
          },
          layers: [layerVersion],
        },
        {
          nameSuffix: `test${outputFormat}Fn`,
          ...(outputFormat === 'ESM' && { outputFormat: 'ESM' }),
        }
      );
    });

    // Deploy the test stack
    await testStack.deploy();

    // Invoke the lambda function once for each output format and collect the logs
    for await (const outputFormat of cases) {
      invocationLogsMap.set(
        outputFormat,
        await invokeFunctionOnce({
          functionName: testStack.findAndGetStackOutputValue(
            `test${outputFormat}Fn`
          ),
        })
      );
    }
  }, SETUP_TIMEOUT);

  describe.each(cases)(
    'utilities tests for %s output format',
    (outputFormat) => {
      let invocationLogs: TestInvocationLogs;
      beforeAll(() => {
        const maybeInvocationLogs = invocationLogsMap.get(outputFormat);
        assertLogs(maybeInvocationLogs);
        invocationLogs = maybeInvocationLogs;
      });

      it('should have no errors in the logs, which indicates the pacakges version matches the expected one', () => {
        const logs = invocationLogs.getFunctionLogs('ERROR');

        expect(logs.length).toBe(0);
      });

      it('should have one warning related to missing Metrics namespace', () => {
        const logs = invocationLogs.getFunctionLogs('WARN');

        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('Namespace should be defined, default used');
      });

      it('should have one info log related to coldstart metric', () => {
        const logs = invocationLogs.getFunctionLogs();
        const emfLogEntry = logs.find((log) =>
          log.match(
            /{"_aws":{"Timestamp":\d+,"CloudWatchMetrics":\[\{"Namespace":"\S+","Dimensions":\[\["service"\]\],"Metrics":\[\{"Name":"ColdStart","Unit":"Count"\}\]\}\]},"service":"\S+","ColdStart":1}/
          )
        );

        expect(emfLogEntry).toBeDefined();
      });

      it('should have one debug log with tracer subsegment info', () => {
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
      });
    }
  );

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testLayerStack.destroy();
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});
