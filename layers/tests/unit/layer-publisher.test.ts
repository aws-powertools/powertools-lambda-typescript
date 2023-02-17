/**
 * Test LayerPublisherStack class
 *
 * @group unit/layers/all
 */

import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import {
  LayerPublisherStack
} from '../../src/layer-publisher-stack';

describe('Class: LayerPublisherStack', () => {

  it('creates the stack with a layer in it', () => {

    // Prepare
    const app = new App();
    const stack = new LayerPublisherStack(app, 'MyTestStack', {
      layerName: 'AWSLambdaPowertoolsTypeScript',
      powertoolsPackageVersion: '1.0.1',
      ssmParameterLayerArn: '/layers/powertools-layer-arn',
    });

    // Act
    const template = Template.fromStack(stack);

    // Assess
    expect(template).toMatchSnapshot();

  });

});