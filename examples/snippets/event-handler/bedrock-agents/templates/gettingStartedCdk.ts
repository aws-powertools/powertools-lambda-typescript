import { Arn, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import { CfnAgent } from 'aws-cdk-lib/aws-bedrock';
import {
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';

export class BedrockAgentsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fnName = 'BedrockAgentsFn';
    const logGroup = new LogGroup(this, 'AirlineAgentLogGroup', {
      logGroupName: `/aws/lambda/${fnName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const fn = new NodejsFunction(this, 'AirlineAgentFunction', {
      functionName: fnName,
      logGroup,
      runtime: Runtime.NODEJS_24_X,
      entry: './src/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        mainFields: ['module', 'main'],
        sourceMap: true,
        format: OutputFormat.ESM,
      },
    });

    const agentRole = new Role(this, 'AirlineAgentRole', {
      assumedBy: new ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role for Bedrock Airline agent',
      inlinePolicies: {
        bedrock: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['bedrock:*'],
              resources: [
                Arn.format(
                  {
                    service: 'bedrock',
                    resource: 'foundation-model/*',
                    region: 'us-*',
                    account: '',
                  },
                  Stack.of(this)
                ),
                Arn.format(
                  {
                    service: 'bedrock',
                    resource: 'inference-profile/*',
                    region: 'us-*',
                    account: '*',
                  },
                  Stack.of(this)
                ),
              ],
            }),
          ],
        }),
      },
    });

    const agent = new CfnAgent(this, 'AirlineAgent', {
      agentName: 'AirlineAgent',
      actionGroups: [
        {
          actionGroupName: 'AirlineActionGroup',
          actionGroupExecutor: {
            lambda: fn.functionArn,
          },
          functionSchema: {
            functions: [
              {
                name: 'getAirportCodeForCity',
                description: 'Get the airport code for a given city',
                parameters: {
                  city: {
                    type: 'string',
                    description:
                      'The name of the city to get the airport code for',
                    required: true,
                  },
                },
              },
            ],
          },
        },
      ],
      agentResourceRoleArn: agentRole.roleArn,
      autoPrepare: true,
      description: 'A simple Airline agent',
      foundationModel: `arn:aws:bedrock:us-west-2:${Stack.of(this).account}:inference-profile/us.amazon.nova-pro-v1:0`,
      instruction:
        'You are an airport traffic control agent. You will be given a city name and you will return the airport code for that city.',
    });
    fn.addPermission('BedrockAgentInvokePermission', {
      principal: new ServicePrincipal('bedrock.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceAccount: this.account,
      sourceArn: `arn:aws:bedrock:${this.region}:${this.account}:agent/${agent.attrAgentId}`,
    });
  }
}
