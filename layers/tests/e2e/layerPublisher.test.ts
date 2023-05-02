/**
 * Test LayerPublisherStack class
 *
 * @group e2e/layers/all
 */
import { App, Stack } from 'aws-cdk-lib';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { LayerPublisherStack } from '../../src/layer-publisher-stack';
import {
  deployStack,
  destroyStack,
} from '../../../packages/commons/tests/utils/cdk-cli';
import {
  generateUniqueName,
  invokeFunction,
  isValidRuntimeKey,
  createStackWithLambdaFunction,
} from '../../../packages/commons/tests/utils/e2eUtils';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';
import {
  LEVEL,
  InvocationLogs,
} from '../../../packages/commons/tests/utils/InvocationLogs';
import { v4 } from 'uuid';
import path from 'path';
import packageJson from '../../package.json';

const runtime: string = process.env.RUNTIME || 'nodejs1x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key: ${runtime}`);
}

describe(`layers E2E tests (LayerPublisherStack) for runtime: ${runtime}`, () => {
  const uuid = v4();
  let invocationLogs: InvocationLogs[];
  const stackNameLayers = generateUniqueName(
    RESOURCE_NAME_PREFIX,
    uuid,
    runtime,
    'layerStack'
  );
  const stackNameFunction = generateUniqueName(
    RESOURCE_NAME_PREFIX,
    uuid,
    runtime,
    'functionStack'
  );
  const functionName = generateUniqueName(
    RESOURCE_NAME_PREFIX,
    uuid,
    runtime,
    'function'
  );
  const ssmParameterLayerName = generateUniqueName(
    RESOURCE_NAME_PREFIX,
    uuid,
    runtime,
    'parameter'
  );
  const lambdaFunctionCodeFile = 'layerPublisher.class.test.functionCode.ts';

  const invocationCount = 1;

  const integTestApp = new App();
  let stackLayer: LayerPublisherStack;
  let stackFunction: Stack;

  const powerToolsPackageVersion = packageJson.version;

  beforeAll(async () => {
    const layerName = generateUniqueName(
      RESOURCE_NAME_PREFIX,
      uuid,
      runtime,
      'layer'
    );

    stackLayer = new LayerPublisherStack(integTestApp, stackNameLayers, {
      layerName: layerName,
      powertoolsPackageVersion: powerToolsPackageVersion,
      ssmParameterLayerArn: ssmParameterLayerName,
    });

    stackFunction = createStackWithLambdaFunction({
      app: integTestApp,
      stackName: stackNameFunction,
      functionName: functionName,
      functionEntry: path.join(__dirname, lambdaFunctionCodeFile),
      tracing: Tracing.ACTIVE,
      environment: {
        UUID: uuid,
        POWERTOOLS_PACKAGE_VERSION: powerToolsPackageVersion,
        POWERTOOLS_SERVICE_NAME: 'LayerPublisherStack',
      },
      runtime: runtime,
      bundling: {
        externalModules: [
          '@aws-lambda-powertools/commons',
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
        ],
      },
      layers: [stackLayer.lambdaLayerVersion],
    });

    await deployStack(integTestApp, stackLayer);
    await deployStack(integTestApp, stackFunction);

    invocationLogs = await invokeFunction(
      functionName,
      invocationCount,
      'SEQUENTIAL'
    );
  }, SETUP_TIMEOUT);

  describe('LayerPublisherStack usage', () => {
    it(
      'should have no errors in the logs, which indicates the pacakges version matches the expected one',
      () => {
        const logs = invocationLogs[0].getFunctionLogs(LEVEL.ERROR);

        expect(logs.length).toBe(0);
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should have one warning related to missing Metrics namespace',
      () => {
        const logs = invocationLogs[0].getFunctionLogs(LEVEL.WARN);

        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('Namespace should be defined, default used');
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should have one info log related to coldstart metric',
      () => {
        const logs = invocationLogs[0].getFunctionLogs(LEVEL.INFO);

        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('ColdStart');
      },
      TEST_CASE_TIMEOUT
    );

    it(
      'should have one debug log that says Hello World!',
      () => {
        const logs = invocationLogs[0].getFunctionLogs(LEVEL.DEBUG);

        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('Hello World!');
      },
      TEST_CASE_TIMEOUT
    );
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stackFunction);
      await destroyStack(integTestApp, stackLayer);
    }
  }, TEARDOWN_TIMEOUT);
});
