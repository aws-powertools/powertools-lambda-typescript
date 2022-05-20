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
  const stack = new LayerPublisher.LayerPublisherStack(app, 'MyTestStack');

  // THEN
  const template = Template.fromStack(stack);

  expect(template).toMatchSnapshot();
});
