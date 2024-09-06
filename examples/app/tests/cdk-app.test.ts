import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { PowertoolsExampleStack } from '../cdk/example-stack.js';

describe('CDK example stack', () => {
  const app = new App();
  const stack = new PowertoolsExampleStack(app, 'MyTestStack');

  it('has 4 Lambda functions', () => {
    Template.fromStack(stack).resourceCountIs('AWS::Lambda::Function', 4);
  });
});
