import { custom_resources, aws_iam } from 'aws-cdk-lib';
import { Events } from '@aws-lambda-powertools/commons';
import { Construct } from 'constructs';
import { Code, Function, FunctionProps, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Tracing, Runtime } from 'aws-cdk-lib/aws-lambda';
import path from 'path';

interface LayeredFunctionProps {
  readonly functionName: string
  readonly tracingActive?: boolean
  readonly invocations?: number
  readonly fnProps?: Partial<FunctionProps>
}

class LayeredFunction extends Construct {

  public constructor(scope: Construct, id: string, props: LayeredFunctionProps) {
    super(scope, id);

    const { functionName, tracingActive, invocations, fnProps } = Object.assign({
      tracingActive: false,
      invocations: 2
    }, props);

    const fn = new Function(this, functionName, {
      tracing: tracingActive ? Tracing.ACTIVE : Tracing.DISABLED,
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(path.join(__dirname, './')),
      handler: 'example-function.MyFunction.handler',
      layers: [
        LayerVersion.fromLayerVersionArn(this, 'AWSLambdaPowertoolsTypeScript', 'arn:aws:lambda:eu-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:1')
      ],
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
  LayeredFunction
};