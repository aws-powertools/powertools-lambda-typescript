/**
 * Test layer
 *
 * @group e2e
 * 
 */

import * as cdk from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as LayerPublisher from '../../src/layer-publisher-stack';
import { deployStack, destroyStack } from '../../../packages/commons/tests/utils/cdk-cli';
import { generateUniqueName, invokeFunction } from '../../../packages/commons/tests/utils/e2eUtils';
import { LEVEL } from '../../../packages/commons/tests/utils/InvocationLogs';

const runtime = lambda.Runtime.ALL.find((r) => r.name === process.env.RUNTIME) ?? lambda.Runtime.NODEJS_14_X;

const powerToolsPackageVersion = '1.0.1';

const e2eTestLayerPublicationApp = new cdk.App();

const layerStack = new LayerPublisher.LayerPublisherStack(
  e2eTestLayerPublicationApp,
  `E2ELayerPublisherStack-${runtime.name.split('.')[0]}`,
  {
    layerName: `e2e-tests-layer-${runtime.name.split('.')[0]}`,
    powerToolsPackageVersion: powerToolsPackageVersion,
    ssmParameterLayerArn: `/e2e-tests-layertools-layer-arn-${runtime.name.split('.')[0]}`,
  }
);

test(`The layer Created is usable with ${runtime} runtime lambda`, async () => {
  // GIVEN
  const { consumerStack, functionName } = createSampleLambda(runtime);

  await deployStack(e2eTestLayerPublicationApp, layerStack);
  await deployStack(e2eTestLayerPublicationApp, consumerStack);

  // WHEN
  const invocationLogs = await invokeFunction(functionName);

  // THEN
  try {
    const errorLogs = invocationLogs[0].getFunctionLogs(LEVEL.ERROR);
    expect(errorLogs.length).toBe(0);

    const warningLogs = invocationLogs[0].getFunctionLogs(LEVEL.WARN);
    expect(warningLogs.length).toBe(1); // the missing namespace warning

    const infoLogs = invocationLogs[0].getFunctionLogs(LEVEL.INFO);
    expect(infoLogs.length).toBe(1); // the coldstart metric one

    const debugLogs = invocationLogs[0].getFunctionLogs(LEVEL.DEBUG);
    expect(debugLogs.length).toBe(1); // the Hello World! message
  } catch (error) {
    console.log(JSON.stringify(invocationLogs[0].getFunctionLogs()));
    throw error;
  }
  finally {
    await destroyStack(e2eTestLayerPublicationApp, consumerStack);
  }
}, 900000);

const createSampleLambda = (runtime: cdk.aws_lambda.Runtime): { consumerStack: cdk.Stack; functionName: string } => {
  const functionName = generateUniqueName('E2ETest', 'Layer', runtime.name.split('.')[0], 'Consumer');

  const consumerStack = new Stack(e2eTestLayerPublicationApp, `${runtime.name.split('.')[0]}ConsumerStack`);
  new nodejs.NodejsFunction(consumerStack, 'lambda', {
    handler: 'handler',
    functionName,
    runtime: runtime,
    bundling: {
      externalModules: [
        '@aws-lambda-powertools/commons',
        '@aws-lambda-powertools/logger',
        '@aws-lambda-powertools/metrics',
        '@aws-lambda-powertools/tracer'
      ]
    },
    environment: {
      POWERTOOLS_PACKAGE_VERSION: powerToolsPackageVersion,
    },
    layers: [layerStack.lambdaLayerVersion],
  });

  return { consumerStack, functionName };
};
