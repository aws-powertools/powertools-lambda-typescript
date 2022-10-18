import { custom_resources, aws_iam } from 'aws-cdk-lib';
import { Events } from '@aws-lambda-powertools/commons';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Tracing, Runtime } from 'aws-cdk-lib/aws-lambda';

interface ExampleFunctionProps {
  readonly functionName: string
  readonly tracingActive?: boolean
  readonly invocations?: number
  readonly fnProps?: Partial<NodejsFunctionProps>
}

class ExampleFunction extends Construct {

  public constructor(scope: Construct, id: string, props: ExampleFunctionProps) {
    super(scope, id);

    const { functionName, tracingActive, invocations, fnProps } = Object.assign({
      tracingActive: false,
      invocations: 2
    }, props);

    const fn = new NodejsFunction(this, functionName, {
      tracing: tracingActive ? Tracing.ACTIVE : Tracing.DISABLED,
      runtime: Runtime.NODEJS_16_X,
      ...fnProps
    });

    for (let i = 0; i < invocations; i++) {
      new custom_resources.AwsCustomResource(this, `Invoke-${functionName}-${i}`, {
        onUpdate: {
          service: 'Lambda',
          action: 'invoke',
          physicalResourceId: custom_resources.PhysicalResourceId.of(`${functionName}-${i}`),
          parameters: {
            FunctionName: fn.functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(Events.Custom.CustomEvent),
          }
        },
        policy: custom_resources.AwsCustomResourcePolicy.fromStatements([
          new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            resources: [
              fn.functionArn,
            ],
            actions: ['lambda:InvokeFunction'],
          }),
        ]),
      });
    }
  }
}

export {
  ExampleFunction
};