import { IAspect, Stack } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { CfnDeployment } from 'aws-cdk-lib/aws-appconfig';
import { StringParameter, IStringParameter } from 'aws-cdk-lib/aws-ssm';

const isStringParameterGeneric = (
  parameter: IConstruct
): parameter is StringParameter | IStringParameter =>
  parameter.hasOwnProperty('parameterArn');

/**
 * An aspect that grants access to resources to a Lambda function.
 *
 * In our integration tests, we dynamically generate AWS CDK stacks that contain a Lambda function.
 * We want to grant access to resources to the Lambda function, but we don't know the name of the
 * Lambda function at the time we create the resources. Additionally, we want to keep the code
 * that creates the stacks and functions as generic as possible.
 *
 * This aspect allows us to grant access to specific resources to all Lambda functions in a stack
 * after the stack tree has been generated and before the stack is deployed. This aspect is
 * used to grant access to different resource types (DynamoDB tables, SSM parameters, etc.).
 *
 * @see {@link https://docs.aws.amazon.com/cdk/v2/guide/aspects.html CDK Docs - Aspects}
 */
export class ResourceAccessGranter implements IAspect {
  private readonly resources:
    | Table[]
    | Secret[]
    | StringParameter[]
    | IStringParameter[]
    | CfnDeployment[];

  public constructor(
    resources:
      | Table[]
      | Secret[]
      | StringParameter[]
      | IStringParameter[]
      | CfnDeployment[]
  ) {
    this.resources = resources;
  }

  public visit(node: IConstruct): void {
    // See that we're dealing with a Function
    if (node instanceof NodejsFunction) {
      // Grant access to the resources
      this.resources.forEach(
        (
          resource:
            | Table
            | Secret
            | StringParameter
            | IStringParameter
            | CfnDeployment
        ) => {
          if (resource instanceof Table) {
            resource.grantReadData(node);
          } else if (resource instanceof Secret) {
            resource.grantRead(node);
          } else if (isStringParameterGeneric(resource)) {
            resource.grantRead(node);

            // Grant access also to the path of the parameter
            node.addToRolePolicy(
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['ssm:GetParametersByPath'],
                resources: [
                  resource.parameterArn.split(':').slice(0, -1).join(':'),
                ],
              })
            );
          } else if (resource instanceof CfnDeployment) {
            const appConfigConfigurationArn = Stack.of(node).formatArn({
              service: 'appconfig',
              resource: `application/${resource.applicationId}/environment/${resource.environmentId}/configuration/${resource.configurationProfileId}`,
            });

            node.addToRolePolicy(
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                  'appconfig:StartConfigurationSession',
                  'appconfig:GetLatestConfiguration',
                ],
                resources: [appConfigConfigurationArn],
              })
            );
          }
        }
      );
    }
  }
}
