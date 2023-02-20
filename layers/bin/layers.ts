#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { LayerPublisherStack } from '../src/layer-publisher-stack';

const SSM_PARAM_LAYER_ARN = '/layers/powertools-layer-arn';

const app = new App();

new LayerPublisherStack(app, 'LayerPublisherStack', {
  powertoolsPackageVersion: app.node.tryGetContext('PowertoolsPackageVersion'),
  layerName: 'AWSLambdaPowertoolsTypeScript',
  ssmParameterLayerArn: SSM_PARAM_LAYER_ARN,
});