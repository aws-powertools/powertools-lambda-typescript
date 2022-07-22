/**
 * Test layer publisher
 *
 * @group unit/layer-publisher
 */

import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as LayerPublisher from '../../src/layer-publisher-stack';

test('Layer  Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new LayerPublisher.LayerPublisherStack(app, 'MyTestStack', {
    layerName: 'AWSLambdaPowertoolsTypeScript',
    powerToolsPackageVersion: '1.0.1',
    ssmParameterLayerArn: '/layers/powertools-layer-arn',
  });

  // THEN
  const template = Template.fromStack(stack);

  expect(template).toMatchSnapshot();
});
