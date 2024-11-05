import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { LayerPublisherStack } from '../../src/layer-publisher-stack';

describe('Class: LayerPublisherStack', () => {
  it('creates the stack with a layer in it', () => {
    // Prepare
    const app = new App();
    const stack = new LayerPublisherStack(app, 'MyTestStack', {
      layerName: 'AWSLambdaPowertoolsTypeScript',
      powertoolsPackageVersion: '1.0.1',
      buildFromLocal: true,
      ssmParameterLayerArn: '/layers/powertools-layer-arn',
    });

    // Act
    const template = Template.fromStack(stack);

    // Assess
    template.resourceCountIs('AWS::Lambda::LayerVersion', 1);
    template.hasResourceProperties('AWS::Lambda::LayerVersion', {
      CompatibleRuntimes: ['nodejs18.x', 'nodejs20.x'],
      LicenseInfo: 'MIT-0',
      /* CompatibleArchitectures: [
        'x86_64',
      ], */
      Description: 'Powertools for AWS Lambda (TypeScript) version 1.0.1',
      LayerName: 'AWSLambdaPowertoolsTypeScript',
    });

    template.resourceCountIs('AWS::Lambda::LayerVersionPermission', 1);
    template.hasResourceProperties('AWS::Lambda::LayerVersionPermission', {
      Action: 'lambda:GetLayerVersion',
      Principal: '*',
    });

    template.resourceCountIs('AWS::SSM::Parameter', 1);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/layers/powertools-layer-arn',
      Type: 'String',
    });
  });
});
