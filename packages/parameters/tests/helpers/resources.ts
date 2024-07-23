import { randomUUID } from 'node:crypto';
import {
  type TestStack,
  concatenateResourceName,
  getArchitectureKey,
  getRuntimeKey,
} from '@aws-lambda-powertools/testing-utils';
import { TestDynamodbTable } from '@aws-lambda-powertools/testing-utils/resources/dynamodb';
import type { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import type {
  ExtraTestProps,
  TestDynamodbTableProps,
} from '@aws-lambda-powertools/testing-utils/types';
import { marshall } from '@aws-sdk/util-dynamodb';
import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  Application,
  type CfnHostedConfigurationVersion,
  ConfigurationContent,
  ConfigurationType,
  DeploymentStrategy,
  HostedConfiguration,
  type IEnvironment,
  RolloutStrategy,
} from 'aws-cdk-lib/aws-appconfig';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import type { SecretProps } from 'aws-cdk-lib/aws-secretsmanager';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  type IStringParameter,
  StringParameter,
  type StringParameterProps,
} from 'aws-cdk-lib/aws-ssm';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

/**
 * A secure string parameter that can be used in tests.
 *
 * It includes some default props and outputs the parameter name.
 */
class TestSecureStringParameter extends Construct {
  public readonly parameterName: string;
  public readonly secureString: IStringParameter;

  public constructor(
    testStack: TestStack,
    props: {
      value: string;
    },
    extraProps: ExtraTestProps
  ) {
    super(
      testStack.stack,
      concatenateResourceName({
        testName: testStack.testName,
        resourceName: randomUUID(),
      })
    );

    const { value } = props;

    const name = `/secure/${getRuntimeKey()}/${getArchitectureKey()}/${randomUUID()}`;
    const secureStringCreator = new AwsCustomResource(
      testStack.stack,
      `create-${randomUUID()}`,
      {
        onCreate: {
          service: 'SSM',
          action: 'putParameter',
          parameters: {
            Name: name,
            Value: value,
            Type: 'SecureString',
          },
          physicalResourceId: PhysicalResourceId.of(name),
        },
        onDelete: {
          service: 'SSM',
          action: 'deleteParameter',
          parameters: {
            Name: name,
          },
        },
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        installLatestAwsSdk: false,
      }
    );

    this.secureString = StringParameter.fromSecureStringParameterAttributes(
      testStack.stack,
      randomUUID(),
      {
        parameterName: name,
      }
    );
    this.secureString.node.addDependency(secureStringCreator);

    this.parameterName = this.secureString.parameterName;

    new CfnOutput(this, `${extraProps.nameSuffix.replace('/', '')}SecStr`, {
      value: name,
    });
  }

  /**
   * Grant read access to the secure string to a function.
   *
   * @param fn The function to grant access to the secure string
   */
  public grantReadData(fn: TestNodejsFunction): void {
    this.secureString.grantRead(fn);

    // Grant access also to the path of the parameter
    fn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParametersByPath'],
        resources: [
          this.secureString.parameterArn.split(':').slice(0, -1).join(':'),
        ],
      })
    );
  }
}

/**
 * A string parameter that can be used in tests.
 */
class TestStringParameter extends StringParameter {
  public constructor(
    testStack: TestStack,
    props: Omit<StringParameterProps, 'parameterName'>,
    extraProps: ExtraTestProps
  ) {
    const parameterId = concatenateResourceName({
      testName: testStack.testName,
      resourceName: extraProps.nameSuffix,
    });

    super(testStack.stack, parameterId, {
      ...props,
      parameterName: `/${parameterId}`,
    });

    new CfnOutput(this, `${extraProps.nameSuffix.replace('/', '')}Str`, {
      value: this.parameterName,
    });
  }
}

/**
 * A secret that can be used in tests.
 */
class TestSecret extends Secret {
  public constructor(
    testStack: TestStack,
    props: Omit<SecretProps, 'secretName'>,
    extraProps: ExtraTestProps
  ) {
    const secretId = concatenateResourceName({
      testName: testStack.testName,
      resourceName: extraProps.nameSuffix,
    });

    super(testStack.stack, secretId, {
      ...props,
      secretName: `/${secretId}`,
    });
  }
}

class TestDynamodbTableWithItems extends TestDynamodbTable {
  public constructor(
    testStack: TestStack,
    props: TestDynamodbTableProps,
    extraProps: ExtraTestProps & {
      items: Record<string, unknown>[];
    }
  ) {
    super(testStack, props, extraProps);

    const { items } = extraProps;

    const id = `putItems-${randomUUID()}`;

    new AwsCustomResource(testStack.stack, id, {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            [this.tableName]: items.map((item) => ({
              PutRequest: {
                Item: marshall(item),
              },
            })),
          },
        },
        physicalResourceId: PhysicalResourceId.of(id),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [this.tableArn],
      }),
      installLatestAwsSdk: false,
    });
  }
}

/**
 * A set of AppConfig resources that can be used in tests.
 */
class TestAppConfigWithProfiles extends Construct {
  private readonly application: Application;
  private readonly deploymentStrategy: DeploymentStrategy;
  private readonly environment: IEnvironment;
  private readonly profiles: HostedConfiguration[] = [];

  public constructor(
    testStack: TestStack,
    props: {
      profiles: {
        nameSuffix: string;
        type: 'AWS.Freeform' | 'AWS.AppConfig.FeatureFlags';
        content: {
          contentType: 'application/json' | 'application/x-yaml' | 'text/plain';
          content: string;
        };
      }[];
    }
  ) {
    super(
      testStack.stack,
      concatenateResourceName({
        testName: testStack.testName,
        resourceName: randomUUID(),
      })
    );

    const { profiles } = props;

    this.application = new Application(testStack.stack, `app-${randomUUID()}`, {
      applicationName: randomUUID(),
      description: 'Test application for Powertools Parameters',
    });

    this.environment = this.application.addEnvironment(`ce-${randomUUID()}`, {
      environmentName: randomUUID(),
      description: 'Test environment for Powertools Parameters',
    });

    this.deploymentStrategy = new DeploymentStrategy(
      testStack.stack,
      `de-${randomUUID()}`,
      {
        deploymentStrategyName: randomUUID(),
        description: 'Test deployment strategy for Powertools Parameter',
        rolloutStrategy: RolloutStrategy.linear({
          deploymentDuration: Duration.minutes(0),
          growthFactor: 100,
          finalBakeTime: Duration.minutes(0),
        }),
      }
    );

    for (const profile of profiles) {
      const config = new HostedConfiguration(
        testStack.stack,
        `hc-${randomUUID()}`,
        {
          name: `${randomUUID()}-${profile.nameSuffix}`,
          description: 'Test hosted configuration for Powertools Parameter',
          deploymentStrategy: this.deploymentStrategy,
          deployTo: [this.environment],
          application: this.application,
          type:
            profile.type === 'AWS.Freeform'
              ? ConfigurationType.FREEFORM
              : ConfigurationType.FEATURE_FLAGS,
          content: ConfigurationContent.fromInlineJson(
            profile.content.content,
            profile.content.contentType
          ),
        }
      );
      // The default is RETAIN so this escape hatch is needed to override it
      (
        config.node.defaultChild as CfnHostedConfigurationVersion
      ).applyRemovalPolicy(RemovalPolicy.DESTROY);
      this.profiles.push(config);
    }
  }

  /**
   * Add the names of the AppConfig resources to the function as environment variables.
   *
   * @param fn The function to add the environment variables to
   */
  public addEnvVariablesToFunction(fn: TestNodejsFunction): void {
    // biome-ignore lint/style/noNonNullAssertion: we know this is called after the AppConfig resources are created
    fn.addEnvironment('APPLICATION_NAME', this.application.name!);
    // biome-ignore lint/style/noNonNullAssertion: we know this is called after the AppConfig resources are created
    fn.addEnvironment('ENVIRONMENT_NAME', this.environment.name!);
    fn.addEnvironment(
      'FREEFORM_JSON_NAME',
      this.profiles[0].configurationProfileId
    );
    fn.addEnvironment(
      'FREEFORM_YAML_NAME',
      this.profiles[1].configurationProfileId
    );
    fn.addEnvironment(
      'FREEFORM_BASE64_ENCODED_PLAIN_TEXT_NAME',
      this.profiles[2].configurationProfileId
    );
    fn.addEnvironment(
      'FEATURE_FLAG_NAME',
      this.profiles[3].configurationProfileId
    );
  }

  /**
   * Grant access to all the profiles to a function.
   *
   * @param fn The function to grant access to the profiles
   */
  public grantReadData(fn: TestNodejsFunction): void {
    for (const profile of this.profiles) {
      const appConfigConfigurationArn = Stack.of(fn).formatArn({
        service: 'appconfig',
        // biome-ignore lint/style/noNonNullAssertion: we know this is called after the AppConfig resources are created
        resource: `application/${profile.application.applicationId}/environment/${profile.deployTo![0].environmentId}/configuration/${profile.configurationProfileId}`,
      });

      fn.addToRolePolicy(
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
}

export {
  TestSecureStringParameter,
  TestStringParameter,
  TestSecret,
  TestDynamodbTableWithItems,
  TestAppConfigWithProfiles,
};
