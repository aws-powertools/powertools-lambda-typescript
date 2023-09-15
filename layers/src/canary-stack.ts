import { CustomResource, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { randomUUID } from 'node:crypto';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

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
      runtime: Runtime.NODEJS_16_X,
      functionName: `canary-${suffix}`,
      timeout: Duration.seconds(30),
      bundling: {
        externalModules: [
          // don't package these modules, we want to pull them from the layer
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
          '@aws-lambda-powertools/commons',
        ],
      },
      environment: {
        POWERTOOLS_SERVICE_NAME: 'canary',
        POWERTOOLS_PACKAGE_VERSION: powertoolsPackageVersion,
        POWERTOOLS_LAYER_NAME: layerName,
        SSM_PARAMETER_LAYER_ARN: props.ssmParameterLayerArn,
      },
      layers: layer,
      logRetention: RetentionDays.ONE_DAY,
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
      logRetention: RetentionDays.ONE_DAY,
    });

    // random suffix forces recreation of the custom resource otherwise the custom resource will be reused from prevous deployment
    new CustomResource(this, `CanaryCustomResource${suffix}`, {
      serviceToken: provider.serviceToken,
    });
  }
}
