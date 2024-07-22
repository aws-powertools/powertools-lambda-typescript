import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { CustomResource, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LayerVersion, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Provider } from 'aws-cdk-lib/custom-resources';
import type { Construct } from 'constructs';

export interface CanaryStackProps extends StackProps {
  readonly layerName: string;
  readonly powertoolsPackageVersion: string;
  readonly ssmParameterLayerArn: string;
}

export class CanaryStack extends Stack {
  public constructor(scope: Construct, id: string, props: CanaryStackProps) {
    super(scope, id, props);
    const { layerName, powertoolsPackageVersion } = props;

    const suffix = randomUUID().substring(0, 5);

    const layerArn = StringParameter.fromStringParameterAttributes(
      this,
      'LayerArn',
      {
        parameterName: props.ssmParameterLayerArn,
      }
    ).stringValue;

    // lambda function
    const layer = [
      LayerVersion.fromLayerVersionArn(this, 'powertools-layer', layerArn),
    ];

    const canaryFunction = new NodejsFunction(this, 'CanaryFunction', {
      entry: path.join(
        __dirname,
        '../tests/e2e/layerPublisher.class.test.functionCode.ts'
      ),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      functionName: `canary-${suffix}`,
      timeout: Duration.seconds(30),
      bundling: {
        externalModules: [
          // don't package these modules, we want to pull them from the layer
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
          '@aws-lambda-powertools/commons',
          '@aws-lambda-powertools/parameters',
          '@aws-lambda-powertools/idempotency',
          '@aws-lambda-powertools/batch',
        ],
      },
      environment: {
        LAYERS_PATH: '/opt/nodejs/node_modules',
        POWERTOOLS_SERVICE_NAME: 'canary',
        POWERTOOLS_PACKAGE_VERSION: powertoolsPackageVersion,
        POWERTOOLS_LAYER_NAME: layerName,
        SSM_PARAMETER_LAYER_ARN: props.ssmParameterLayerArn,
      },
      layers: layer,
      logRetention: RetentionDays.TEN_YEARS,
      tracing: Tracing.ACTIVE,
    });

    canaryFunction.addToRolePolicy(
      new PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: ['*'],
        effect: Effect.ALLOW,
      })
    );

    // use custom resource to trigger the lambda function during the CFN deployment
    const provider = new Provider(this, 'CanaryCustomResourceProvider', {
      onEventHandler: canaryFunction,
      logRetention: RetentionDays.TEN_YEARS,
    });

    // random suffix forces recreation of the custom resource otherwise the custom resource will be reused from prevous deployment
    new CustomResource(this, `CanaryCustomResource${suffix}`, {
      serviceToken: provider.serviceToken,
    });
  }
}
