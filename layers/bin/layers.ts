#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CanaryStack } from 'layers/src/canary-stack';
import { LayerPublisherStack } from '../src/layer-publisher-stack';

const SSM_PARAM_LAYER_ARN = '/layers/powertools-layer-arn';

const app = new App();

new LayerPublisherStack(app, 'LayerPublisherStack', {
  powertoolsPackageVersion: app.node.tryGetContext('PowertoolsPackageVersion'),
  buildFromLocal: app.node.tryGetContext('BuildFromLocal') || false,
  layerName: 'AWSLambdaPowertoolsTypeScriptV2',
  ssmParameterLayerArn: SSM_PARAM_LAYER_ARN,
});

new CanaryStack(app, 'CanaryStack', {
  powertoolsPackageVersion: app.node.tryGetContext('PowertoolsPackageVersion'),
  ssmParameterLayerArn: SSM_PARAM_LAYER_ARN,
  layerName: 'AWSLambdaPowertoolsCanaryTypeScript',
});
