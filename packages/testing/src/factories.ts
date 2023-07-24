import { CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Tracing, Architecture } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
} from 'aws-cdk-lib/custom-resources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Table, BillingMode, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { TEST_RUNTIMES } from './constants';
import { marshall } from '@aws-sdk/util-dynamodb';
import type { IStringParameter } from 'aws-cdk-lib/aws-ssm';
import type {
  NodejsFunctionOptions,
  DynamoDBTableOptions,
  SsmSecureStringOptions,
  DynamoDBItemOptions,
  SsmStringOptions,
} from './types';

/**
 * Add a NodejsFunction to the test stack.
 *
 * @param options - The options for creating a NodejsFunction.
 */
const nodejsFunction = (options: NodejsFunctionOptions): NodejsFunction => {
  const nodeJsFunction = new NodejsFunction(options.stack, options.resourceId, {
    runtime: TEST_RUNTIMES[options.runtime],
    functionName: options.functionConfigs?.name,
    timeout: Duration.seconds(options.functionConfigs?.timeout || 30),
    entry: options?.functionCode?.path,
    handler: options?.functionCode?.handler || 'handler',
    environment: {
      ...(options.functionConfigs?.environment || {}),
    },
    tracing: options.functionConfigs?.tracing || Tracing.ACTIVE,
    memorySize: options.functionConfigs?.memorySize || 256,
    architecture: options.functionConfigs?.architecture || Architecture.X86_64,
    logRetention: RetentionDays.ONE_DAY,
    bundling: options?.functionCode?.bundling,
  });

  if (options.logGroupOutputKey) {
    new CfnOutput(options.stack, options.logGroupOutputKey, {
      value: nodeJsFunction.logGroup.logGroupName,
    });
  }

  return nodeJsFunction;
};

/**
 * Add a DynamoDB table to the test stack.
 *
 * @param options - The options for creating a DynamoDB table.
 */
const dynamoDBTable = (options: DynamoDBTableOptions): Table => {
  const table = new Table(options.stack, options.resourceId, {
    tableName: options.name,
    partitionKey: {
      name: options?.partitionKey?.name || 'id',
      type: options?.partitionKey?.type || AttributeType.STRING,
    },
    ...(options?.sortKey || {}),
    billingMode: options.billingMode || BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  return table;
};

/**
 * Add an item to a DynamoDB table in the test stack.
 *
 * @param options - The options for creating a DynamoDB item.
 */
const dynamoDBItem = (options: DynamoDBItemOptions): void => {
  new AwsCustomResource(options.stack, options.resourceId, {
    onCreate: {
      service: 'DynamoDB',
      action: 'putItem',
      parameters: {
        TableName: options.tableName,
        Item: marshall(options.item),
      },
      physicalResourceId: PhysicalResourceId.of(options.resourceId),
    },
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: [options.tableArn],
    }),
  });
};

/**
 * Add a SSM String parameter to the test stack.
 *
 * @param options - The options for creating a SSM String parameter.
 */
const ssmString = (options: SsmStringOptions): StringParameter => {
  const ssmString = new StringParameter(options.stack, options.resourceId, {
    parameterName: options.name,
    stringValue: options.value,
  });

  return ssmString;
};

/**
 * Add a SSM SecureString parameter to the test stack.
 *
 * @param options - The options for creating a SSM SecureString parameter.
 */
const ssmSecureString = (options: SsmSecureStringOptions): IStringParameter => {
  const resourceCreator = new AwsCustomResource(
    options.stack,
    `creator-${options.resourceId}`,
    {
      onCreate: {
        service: 'SSM',
        action: 'putParameter',
        parameters: {
          Name: options.name || options.resourceId,
          Value: options.value,
          Type: 'SecureString',
        },
        physicalResourceId: PhysicalResourceId.of(options.resourceId),
      },
      onDelete: {
        service: 'SSM',
        action: 'deleteParameter',
        parameters: {
          Name: options.name || options.resourceId,
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    }
  );

  const secureString = StringParameter.fromSecureStringParameterAttributes(
    options.stack,
    options.resourceId,
    {
      parameterName: options.name || options.resourceId,
    }
  );
  secureString.node.addDependency(resourceCreator);

  return secureString;
};

export {
  nodejsFunction,
  dynamoDBTable,
  dynamoDBItem,
  ssmSecureString,
  ssmString,
};
