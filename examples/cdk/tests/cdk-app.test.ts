import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as CdkApp from '../src/example-stack';

test('It Deploys', () => {
  const app = new cdk.App();
  const stack = new CdkApp.CdkAppStack(app, 'MyTestStack');
  expect(Template.fromStack(stack)).toMatchSnapshot();
});
