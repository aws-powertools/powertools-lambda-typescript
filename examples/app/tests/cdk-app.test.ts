import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PowertoolsExampleStack } from '../cdk/example-stack.js';

test('CDK code synthesize', () => {
  const app = new App();
  const stack = new PowertoolsExampleStack(app, 'MyTestStack');
  Template.fromStack(stack).resourceCountIs('AWS::Lambda::Function', 4);
});
