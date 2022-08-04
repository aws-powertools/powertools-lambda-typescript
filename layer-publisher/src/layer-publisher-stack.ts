import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaPowertoolsLayer } from 'cdk-lambda-powertools-python-layer';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { CfnLayerVersionPermission } from 'aws-cdk-lib/aws-lambda';

export interface LayerPublisherStackProps extends StackProps {
  readonly layerName?: string
  readonly powerToolsPackageVersion?: string
  readonly ssmParameterLayerArn: string
}

export class LayerPublisherStack extends Stack {
  public readonly lambdaLayerVersion: lambda.LayerVersion;
  public constructor(scope: Construct, id: string, props: LayerPublisherStackProps) {
    super(scope, id, props);

    this.lambdaLayerVersion = new LambdaPowertoolsLayer(this, 'LambdaPowertoolsLayer', {
      layerVersionName: props?.layerName,
      runtimeFamily: lambda.RuntimeFamily.NODEJS,
      version: props?.powerToolsPackageVersion,
    });

    const layerPermission = new CfnLayerVersionPermission(this, 'PublicLayerAccess', {
      action: 'lambda:GetLayerVersion',
      layerVersionArn: this.lambdaLayerVersion.layerVersionArn,
      principal: '*',
    });

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
