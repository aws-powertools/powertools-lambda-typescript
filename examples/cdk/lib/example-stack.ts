import { Stack, StackProps, custom_resources, aws_iam } from 'aws-cdk-lib';
import { Events } from '@aws-lambda-powertools/commons';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Tracing } from 'aws-cdk-lib/aws-lambda';

export class CdkAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const myFunctionWithStandardFunctions = new lambda.NodejsFunction(this, 'MyFunction', { tracing: Tracing.ACTIVE });
    const myFunctionWithDecorator = new lambda.NodejsFunction(this, 'MyFunctionWithDecorator', {
      tracing: Tracing.ACTIVE,
    });
    const myFunctionWithWithMiddleware = new lambda.NodejsFunction(this, 'MyFunctionWithMiddy', {
      tracing: Tracing.ACTIVE,
    });

    // Invoke all functions twice
    for (let i = 0; i < 2; i++) {
      new custom_resources.AwsCustomResource(this, `Invoke-std-func-${i}`, {
        onUpdate: {
          service: 'Lambda',
          action: 'invoke',
          physicalResourceId: custom_resources.PhysicalResourceId.of(new Date().toISOString()),
          parameters: {
            FunctionName: myFunctionWithStandardFunctions.functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(Events.Custom.CustomEvent),
          }
        },
        policy: custom_resources.AwsCustomResourcePolicy.fromStatements([
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            resources: [
              myFunctionWithStandardFunctions.functionArn,
            ],
            actions: ['lambda:InvokeFunction'],
          }),
        ]),
      });
      new custom_resources.AwsCustomResource(this, `Invoke-dec-func-${i}`, {
        onUpdate: {
          service: 'Lambda',
          action: 'invoke',
          physicalResourceId: custom_resources.PhysicalResourceId.of(new Date().toISOString()),
          parameters: {
            FunctionName: myFunctionWithDecorator.functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(Events.Custom.CustomEvent),
          }
        },
        policy: custom_resources.AwsCustomResourcePolicy.fromStatements([
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            resources: [
              myFunctionWithDecorator.functionArn,
            ],
            actions: ['lambda:InvokeFunction'],
          }),
        ]),
      });
      new custom_resources.AwsCustomResource(this, `Invoke-middy-func-${i}`, {
        onUpdate: {
          service: 'Lambda',
          action: 'invoke',
          physicalResourceId: custom_resources.PhysicalResourceId.of(new Date().toISOString()),
          parameters: {
            FunctionName: myFunctionWithWithMiddleware.functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(Events.Custom.CustomEvent),
          }
        },
        policy: custom_resources.AwsCustomResourcePolicy.fromStatements([
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            resources: [
              myFunctionWithWithMiddleware.functionArn,
            ],
            actions: ['lambda:InvokeFunction'],
          }),
        ]),
      });
    }
  }
}
