import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as CdkApp from '../src/example-stack';

test('CDK code synthesize', () => {
  const app = new cdk.App();
  const stack = new CdkApp.CdkAppStack(app, 'MyTestStack');
  Template.fromStack(stack).resourceCountIs('AWS::Lambda::Function', 5); // The stack has 4 functions: 3 for the example, and 1 for the log retention that is deployed by CDK
});
