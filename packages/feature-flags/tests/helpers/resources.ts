import { randomUUID } from 'node:crypto';
import {
  concatenateResourceName,
  getArchitectureKey,
  type TestStack,
} from '@aws-lambda-powertools/testing-utils';
import type { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
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
import { type ILayerVersion, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

/**
 * ARNs of the AWS AppConfig Agent Lambda extension layer, see:
 * https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions-versions.html
 *
 * The layer publisher account ID differs per region, so we keep a map of the regions
 * where we run the end-to-end tests. All the ARNs point to extension version `2.0.18836`,
 * the same ones used by the Parameters AppConfig Agent end-to-end tests.
 */
const appConfigAgentLayerArns = {
  'us-east-1': {
    x86_64:
      'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension:328',
    arm64:
      'arn:aws:lambda:us-east-1:027255383542:layer:AWS-AppConfig-Extension-Arm64:261',
  },
  'eu-west-1': {
    x86_64:
      'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension:305',
    arm64:
      'arn:aws:lambda:eu-west-1:434848589818:layer:AWS-AppConfig-Extension-Arm64:243',
  },
} satisfies Record<string, Record<'x86_64' | 'arm64', string>>;

/**
 * Import the AppConfig Agent Lambda extension layer for the current region and architecture.
 *
 * @param testStack - The stack to import the layer into
 */
const getAppConfigAgentLayer = (testStack: TestStack): ILayerVersion => {
  const region = process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION;
  const layerArn =
    region && region in appConfigAgentLayerArns
      ? appConfigAgentLayerArns[region as keyof typeof appConfigAgentLayerArns][
          getArchitectureKey()
        ]
      : undefined;
  if (!layerArn) {
    throw new Error(
      `No AppConfig Agent Lambda extension layer ARN known for region '${region}' and architecture '${getArchitectureKey()}'`
    );
  }

  return LayerVersion.fromLayerVersionArn(
    testStack.stack,
    `appConfigAgentLayer-${randomUUID().substring(0, 5)}`,
    layerArn
  );
};

/**
 * A set of AppConfig resources used by the Feature Flags tests.
 *
 * It creates one application and environment with two hosted configuration profiles:
 * - a freeform JSON profile containing a Flag Document, read by `appConfigStore` and `appConfigAgentStore`
 * - a feature flag profile, read by `appConfigVariantStore`
 */
class TestFeatureFlagsAppConfig extends Construct {
  private readonly application: Application;
  private readonly environment: IEnvironment;
  private readonly freeform: HostedConfiguration;
  private readonly featureFlags: HostedConfiguration;

  public constructor(
    testStack: TestStack,
    props: {
      flagDocument: Record<string, unknown>;
      featureFlagProfile: Record<string, unknown>;
    }
  ) {
    super(
      testStack.stack,
      concatenateResourceName({
        testName: testStack.testName,
        resourceName: randomUUID(),
      })
    );

    const { flagDocument, featureFlagProfile } = props;

    this.application = new Application(testStack.stack, `app-${randomUUID()}`, {
      applicationName: randomUUID(),
      description: 'Test application for Powertools Feature Flags',
    });

    this.environment = this.application.addEnvironment(`ce-${randomUUID()}`, {
      environmentName: randomUUID(),
      description: 'Test environment for Powertools Feature Flags',
    });

    const deploymentStrategy = new DeploymentStrategy(
      testStack.stack,
      `de-${randomUUID()}`,
      {
        deploymentStrategyName: randomUUID(),
        description: 'Test deployment strategy for Powertools Feature Flags',
        rolloutStrategy: RolloutStrategy.linear({
          deploymentDuration: Duration.minutes(0),
          growthFactor: 100,
          finalBakeTime: Duration.minutes(0),
        }),
      }
    );

    const createProfile = (
      nameSuffix: string,
      type: ConfigurationType,
      content: Record<string, unknown>
    ): HostedConfiguration => {
      const config = new HostedConfiguration(
        testStack.stack,
        `hc-${randomUUID()}`,
        {
          name: `${randomUUID()}-${nameSuffix}`,
          description: 'Test hosted configuration for Powertools Feature Flags',
          deploymentStrategy,
          deployTo: [this.environment],
          application: this.application,
          type,
          content: ConfigurationContent.fromInlineJson(
            JSON.stringify(content),
            'application/json'
          ),
        }
      );
      // The default is RETAIN so this escape hatch is needed to override it
      (
        config.node.defaultChild as CfnHostedConfigurationVersion
      ).applyRemovalPolicy(RemovalPolicy.DESTROY);

      return config;
    };

    this.freeform = createProfile(
      'freeform',
      ConfigurationType.FREEFORM,
      flagDocument
    );
    this.featureFlags = createProfile(
      'featureFlags',
      ConfigurationType.FEATURE_FLAGS,
      featureFlagProfile
    );
  }

  /**
   * Add the names of the AppConfig resources to the function as environment variables.
   *
   * @param fn - The function to add the environment variables to
   */
  public addEnvVariablesToFunction(fn: TestNodejsFunction): void {
    // biome-ignore lint/style/noNonNullAssertion: we know this is called after the AppConfig resources are created
    fn.addEnvironment('APPLICATION_NAME', this.application.name!);
    // biome-ignore lint/style/noNonNullAssertion: we know this is called after the AppConfig resources are created
    fn.addEnvironment('ENVIRONMENT_NAME', this.environment.name!);
    fn.addEnvironment('FREEFORM_NAME', this.freeform.configurationProfileId);
    fn.addEnvironment(
      'FEATURE_FLAG_NAME',
      this.featureFlags.configurationProfileId
    );
  }

  /**
   * Grant access to both profiles to a function.
   *
   * @param fn - The function to grant access to the profiles
   */
  public grantReadData(fn: TestNodejsFunction): void {
    this.grant(fn, [
      'appconfig:StartConfigurationSession',
      'appconfig:GetLatestConfiguration',
    ]);
  }

  /**
   * Grant only `appconfig:StartConfigurationSession` on both profiles to a function.
   *
   * The function can open a configuration session but every
   * `appconfig:GetLatestConfiguration` call is denied by IAM.
   *
   * @param fn - The function to grant the partial access to
   */
  public grantStartConfigurationSessionOnly(fn: TestNodejsFunction): void {
    this.grant(fn, ['appconfig:StartConfigurationSession']);
  }

  private grant(fn: TestNodejsFunction, actions: string[]): void {
    for (const profile of [this.freeform, this.featureFlags]) {
      const appConfigConfigurationArn = Stack.of(fn).formatArn({
        service: 'appconfig',
        resource: `application/${this.application.applicationId}/environment/${this.environment.environmentId}/configuration/${profile.configurationProfileId}`,
      });

      fn.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions,
          resources: [appConfigConfigurationArn],
        })
      );
    }
  }
}

export { getAppConfigAgentLayer, TestFeatureFlagsAppConfig };
