import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import { PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { StringParameter, IStringParameter } from 'aws-cdk-lib/aws-ssm';
import { Table, TableProps, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import {
  CfnApplication,
  CfnConfigurationProfile,
  CfnDeployment,
  CfnDeploymentStrategy,
  CfnEnvironment,
  CfnHostedConfigurationVersion,
} from 'aws-cdk-lib/aws-appconfig';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy
} from 'aws-cdk-lib/custom-resources';
import { marshall } from '@aws-sdk/util-dynamodb';

export type CreateDynamoDBTableOptions = {
  stack: Stack
  id: string
} & TableProps;

const createDynamoDBTable = (options: CreateDynamoDBTableOptions): Table => {
  const { stack, id, ...tableProps } = options;
  const props = {
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
    ...tableProps,
  };

  return new Table(stack, id, props);
};

export type AppConfigResourcesOptions = {
  stack: Stack
  applicationName: string
  environmentName: string
  deploymentStrategyName: string
};

type AppConfigResourcesOutput = {
  application: CfnApplication
  environment: CfnEnvironment
  deploymentStrategy: CfnDeploymentStrategy
};

/**
 * Utility function to create the base resources for an AppConfig application.
 */
const createBaseAppConfigResources = (options: AppConfigResourcesOptions): AppConfigResourcesOutput => {
  const {
    stack,
    applicationName,
    environmentName,
    deploymentStrategyName,
  } = options;

  // create a new app config application.
  const application = new CfnApplication(
    stack,
    'application',
    {
      name: applicationName,
    }
  );

  const environment = new CfnEnvironment(stack, 'environment', {
    name: environmentName,
    applicationId: application.ref,
  });

  const deploymentStrategy = new CfnDeploymentStrategy(stack, 'deploymentStrategy', {
    name: deploymentStrategyName,
    deploymentDurationInMinutes: 0,
    growthFactor: 100,
    replicateTo: 'NONE',
    finalBakeTimeInMinutes: 0,
  });

  return {
    application,
    environment,
    deploymentStrategy,
  };
};

export type CreateAppConfigConfigurationProfileOptions = {
  stack: Stack
  name: string
  application: CfnApplication
  environment: CfnEnvironment
  deploymentStrategy: CfnDeploymentStrategy
  type: 'AWS.Freeform' | 'AWS.AppConfig.FeatureFlags'
  content: {
    contentType: 'application/json' | 'application/x-yaml' | 'text/plain'
    content: string
  }
};

/**
 * Utility function to create an AppConfig configuration profile and deployment.
 */
const createAppConfigConfigurationProfile = (options: CreateAppConfigConfigurationProfileOptions): CfnDeployment => {
  const {
    stack,
    name,
    application,
    environment,
    deploymentStrategy,
    type,
    content,
  } = options;
  
  const configProfile = new CfnConfigurationProfile(stack, `${name}-configProfile`, {
    name,
    applicationId: application.ref,
    locationUri: 'hosted',
    type,
  });

  const configVersion = new CfnHostedConfigurationVersion(stack, `${name}-configVersion`, {
    applicationId: application.ref,
    configurationProfileId: configProfile.ref,
    ...content
  });

  return new CfnDeployment(stack, `${name}-deployment`, {
    applicationId: application.ref,
    configurationProfileId: configProfile.ref,
    configurationVersion: configVersion.ref,
    deploymentStrategyId: deploymentStrategy.ref,
    environmentId: environment.ref,
  });
};

export type CreateSSMSecureStringOptions = {
  stack: Stack
  id: string
  name: string
  value: string
};

const createSSMSecureString = (options: CreateSSMSecureStringOptions): IStringParameter => {
  const { stack, id, name, value } = options;

  const paramCreator = new AwsCustomResource(stack, `create-${id}`, {
    onCreate: {
      service: 'SSM',
      action: 'putParameter',
      parameters: {
        Name: name,
        Value: value,
        Type: 'SecureString',
      },
      physicalResourceId: PhysicalResourceId.of(id),
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
  });

  const param = StringParameter.fromSecureStringParameterAttributes(stack, id, {
    parameterName: name,
  });
  param.node.addDependency(paramCreator);

  return param;
};

export type PutDynamoDBItemOptions = {
  stack: Stack
  id: string
  table: Table
  item: Record<string, unknown>
};

const putDynamoDBItem = async (options: PutDynamoDBItemOptions): Promise<void> => {
  const { stack, id, table, item } = options;

  new AwsCustomResource(stack, id, {
    onCreate: {
      service: 'DynamoDB',
      action: 'putItem',
      parameters: {
        TableName: table.tableName,
        Item: marshall(item),
      },
      physicalResourceId: PhysicalResourceId.of(id),
    },
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: [table.tableArn],
    }),
  });
};

export {
  createDynamoDBTable,
  createBaseAppConfigResources,
  createAppConfigConfigurationProfile,
  createSSMSecureString,
  putDynamoDBItem,
};
