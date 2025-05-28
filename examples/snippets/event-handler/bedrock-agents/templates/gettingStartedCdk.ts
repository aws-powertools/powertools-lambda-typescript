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
    const logGroup = new LogGroup(this, 'WeatherAgentLogGroup', {
      logGroupName: `/aws/lambda/${fnName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const fn = new NodejsFunction(this, 'WeatherAgentFunction', {
      functionName: fnName,
      logGroup,
      runtime: Runtime.NODEJS_22_X,
      entry: './src/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        mainFields: ['module', 'main'],
        sourceMap: true,
        format: OutputFormat.ESM,
      },
    });

    const agentRole = new Role(this, 'WeatherAgentRole', {
      assumedBy: new ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role for Bedrock weather agent',
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

    const agent = new CfnAgent(this, 'WeatherAgent', {
      agentName: 'weatherAgent',
      actionGroups: [
        {
          actionGroupName: 'weatherActionGroup',
          actionGroupExecutor: {
            lambda: fn.functionArn,
          },
          functionSchema: {
            functions: [
              {
                name: 'getWeatherForCity',
                description: 'Get weather for a specific city',
                parameters: {
                  city: {
                    type: 'string',
                    description: 'The name of the city to get the weather for',
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
      description: 'A simple weather agent',
      foundationModel: `arn:aws:bedrock:us-west-2:${Stack.of(this).account}:inference-profile/us.amazon.nova-pro-v1:0`,
      instruction:
        'You are a weather forecast news anchor. You will be asked to provide a weather forecast for one or more cities. You will provide a weather forecast for each city as if you were a TV news anchor. While doing so, include the region or country of the city received from the tool. You will provide the forecast in a conversational tone, as if you were speaking to a viewer on a TV news program.',
    });
    fn.addPermission('BedrockAgentInvokePermission', {
      principal: new ServicePrincipal('bedrock.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceAccount: this.account,
      sourceArn: `arn:aws:bedrock:${this.region}:${this.account}:agent/${agent.attrAgentId}`,
    });
  }
}
