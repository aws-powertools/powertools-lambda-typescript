import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ExampleFunction } from './example-function';

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new ExampleFunction(this, 'MyFunction', {
      functionName: 'MyFunction',
      tracingActive: true,
    });
    new ExampleFunction(this, 'MyFunctionWithDecorator', {
      functionName: 'MyFunctionWithDecorator',
      tracingActive: true,
    });
    new ExampleFunction(this, 'MyFunctionWithMiddy', {
      functionName: 'MyFunctionWithMiddy',
      tracingActive: true,
    });
  }
}
