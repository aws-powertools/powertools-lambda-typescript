import { CustomResource, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { v4 } from 'uuid';
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
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

    const suffix = v4().substring(0, 5);

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

    const executionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    executionRole.addToPolicy(
      new PolicyStatement({
        actions: ['lambda:GetFunction'],
        resources: ['*'],
        effect: Effect.ALLOW,
      })
    );

    const canaryFunction = new NodejsFunction(this, 'CanaryFunction', {
      entry: path.join(__dirname, './canary/app.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      functionName: `canary-${suffix}`,
      timeout: Duration.seconds(30),
      bundling: {
        externalModules: [
          // don't package these modules, we want to pull them from the layer
          'aws-sdk',
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
          '@aws-lambda-powertools/parameters',
          '@aws-lambda-powertools/commons',
        ],
      },
      role: executionRole,
      environment: {
        POWERTOOLS_SERVICE_NAME: 'canary',
        POWERTOOLS_VERSION: powertoolsPackageVersion,
        POWERTOOLS_LAYER_NAME: layerName,
      },
      layers: layer,
      logRetention: RetentionDays.ONE_DAY,
    });

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
