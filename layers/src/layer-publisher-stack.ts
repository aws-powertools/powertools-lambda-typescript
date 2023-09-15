import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  LayerVersion,
  Code,
  Runtime,
  CfnLayerVersionPermission,
} from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { resolve } from 'node:path';

export interface LayerPublisherStackProps extends StackProps {
  readonly layerName?: string;
  readonly powertoolsPackageVersion?: string;
  readonly ssmParameterLayerArn: string;
}

export class LayerPublisherStack extends Stack {
  public readonly lambdaLayerVersion: LayerVersion;
  public constructor(
    scope: Construct,
    id: string,
    props: LayerPublisherStackProps
  ) {
    super(scope, id, props);

    const { layerName, powertoolsPackageVersion } = props;

    console.log(
      `publishing layer ${layerName} version : ${powertoolsPackageVersion}`
    );

    this.lambdaLayerVersion = new LayerVersion(this, 'LambdaPowertoolsLayer', {
      layerVersionName: props?.layerName,
      description: `Powertools for AWS Lambda (TypeScript) version ${powertoolsPackageVersion}`,
      compatibleRuntimes: [Runtime.NODEJS_16_X, Runtime.NODEJS_18_X],
      license: 'MIT-0',
      // This is needed because the following regions do not support the compatibleArchitectures property #1400
      // ...(![ 'eu-south-2', 'eu-central-2', 'ap-southeast-4' ].includes(Stack.of(this).region) ? { compatibleArchitectures: [Architecture.X86_64] } : {}),
      code: Code.fromAsset(resolve(__dirname, '..', '..', 'tmp')),
    });

    const layerPermission = new CfnLayerVersionPermission(
      this,
      'PublicLayerAccess',
      {
        action: 'lambda:GetLayerVersion',
        layerVersionArn: this.lambdaLayerVersion.layerVersionArn,
        principal: '*',
      }
    );

    layerPermission.applyRemovalPolicy(RemovalPolicy.RETAIN);
    this.lambdaLayerVersion.applyRemovalPolicy(RemovalPolicy.RETAIN);

    new StringParameter(this, 'VersionArn', {
      parameterName: props.ssmParameterLayerArn,
      stringValue: this.lambdaLayerVersion.layerVersionArn,
    });

    new CfnOutput(this, 'LatestLayerArn', {
      value: this.lambdaLayerVersion.layerVersionArn,
      exportName: props?.layerName ?? `LambdaPowerToolsForTypeScriptLayerARN`,
    });
  }
}
