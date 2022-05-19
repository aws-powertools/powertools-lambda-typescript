/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaPowertoolsLayer } from 'cdk-lambda-powertools-python-layer';

export interface LayerPublisherStackProps extends StackProps {
  readonly layerName: string
}

export class LayerPublisherStack extends Stack {
  readonly lambdaLayerVersion: lambda.LayerVersion;
  constructor(scope: Construct, id: string, props?: LayerPublisherStackProps) {
    super(scope, id, props);

    this.lambdaLayerVersion = new LambdaPowertoolsLayer(this, 'LambdaPowertoolsLayer', {
      layerVersionName: props?.layerName,
      runtimeFamily: lambda.RuntimeFamily.NODEJS,
    });

    new CfnOutput(this, 'LambdaPowerToolsForTypeScriptLayerARN', {
      value: this.lambdaLayerVersion.layerVersionArn,
      exportName: 'LambdaPowerToolsForTypeScriptLayerARN',
    });
  }
}
