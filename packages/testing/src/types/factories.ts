import type { Stack } from 'aws-cdk-lib';
import type { FunctionOptions } from 'aws-cdk-lib/aws-lambda';
import type { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { TEST_RUNTIMES } from '../constants';

/**
 * Options for creating a NodejsFunction.
 */
type NodejsFunctionOptions = {
  /**
   * The stack to add the function to.
   */
  stack: Stack;
  /**
   * The unique identifier for the function.
   */
  resourceId: string;
  /**
   * The runtime for the function.
   */
  runtime: keyof typeof TEST_RUNTIMES;
  /**
   * The function code.
   */
  functionCode: {
    /**
     * The absolute path to the entry file.
     * @default - None
     */
    path: NodejsFunctionProps['entry'];
    /**
     * The name of the function handler.
     * @default - handler
     */
    handler?: NodejsFunctionProps['handler'];
    /**
     * Options for bundling with esbuild.
     */
    bundling?: NodejsFunctionProps['bundling'];
  };
  /**
   * Function configurations.
   */
  functionConfigs?: {
    /**
     * The amount of memory, in MB, that is allocated to your Lambda function.
     * @default - The default value is 256 MB.
     */
    memorySize?: FunctionOptions['memorySize'];
    /**
     * The function execution time (in seconds) after which Lambda terminates the function.
     * @default - The default value is 30 seconds.
     */
    timeout?: number;
    /**
     * The environment variables for the Lambda function service.
     * @default - No environment variables.
     */
    environment?: FunctionOptions['environment'];
    /**
     * A name for the function.
     * @default - The utility will generate a unique name for the function.
     */
    name?: FunctionOptions['functionName'];
    /**
     * Enable AWS X-Ray Tracing for Lambda Function.
     * @default - Enabled
     */
    tracing?: FunctionOptions['tracing'];
    /**
     * The Lambda runtime architecture to use.
     * @default - x86_64
     */
    architecture?: FunctionOptions['architecture'];
  };
  /**
   * The name of the CloudFormation Output key to store the log group name.
   *
   * When this property is set, the log group name will be stored in the CloudFormation Output.
   *
   * @default - No output
   */
  logGroupOutputKey?: string;
};

/**
 * Options for creating a DynamoDB table.
 */
type DynamoDBTableOptions = {
  /**
   * The stack to add the table to.
   */
  stack: Stack;
  /**
   * The unique identifier for the table.
   */
  resourceId: string;
  /**
   * The name of the table.
   */
  name?: string;
  /**
   * The partition key for the table.
   * @default - id (string)
   */
  partitionKey?: {
    /**
     * The name of the partition key.
     * @default - id
     */
    name?: string;
    /**
     * The type of the partition key.
     * @default - AttributeType.STRING
     */
    type?: AttributeType;
  };
  /**
   * The sort key for the table.
   * @default - None
   */
  sortKey?: {
    /**
     * The name of the sort key.
     * @default - None
     */
    name?: string;
    /**
     * The type of the sort key.
     * @default - None
     */
    type?: AttributeType;
  };
  /**
   * The billing mode for the table.
   * @default - BillingMode.PAY_PER_REQUEST
   */
  billingMode?: BillingMode;
  /**
   * The name of the environment variable that will store the table name
   * and that will be applied to the function.
   * @default - TABLE_NAME
   */
  envVariableName?: string;
  /**
   * Items to add to the table.
   */
  items?: Array<DynamoDBItemOptions>;
};

/**
 * Add an item to a DynamoDB table.
 */
type DynamoDBItemOptions = {
  /**
   * The stack to of the table to add the item to.
   */
  stack: Stack;
  /**
   * The unique identifier for the item.
   */
  resourceId: string;
  /**
   * The name of the table to add the item to.
   */
  tableName: string;
  /**
   * The arn of the table to add the item to.
   */
  tableArn: string;
  /**
   * The item to add to the table.
   */
  item: Record<string, unknown>;
};

/**
 * Options for creating a SSM Secure String.
 */
type SsmSecureStringOptions = {
  /**
   * The stack to add the secure string to.
   */
  stack: Stack;
  /**
   * The unique identifier for the secure string.
   */
  resourceId: string;
  /**
   * The name of the secure string.
   * @default - Same as resourceId
   */
  name?: string;
  /**
   * The value of the secure string.
   */
  value: string;
  /**
   * The name of the environment variable that will store the name
   * of the string and that will be applied to the function.
   * @default - SECURE_STRING_NAME
   */
  envVariableName?: string;
};

/**
 * Options for creating a SSM String.
 */
type SsmStringOptions = {
  /**
   * The stack to add the string to.
   */
  stack: Stack;
  /**
   * The unique identifier for the string.
   */
  resourceId: string;
  /**
   * The name of the string.
   * @default - Same as resourceId
   */
  name?: string;
  /**
   * The value of the string.
   */
  value: string;
  /**
   * The name of the environment variable that will store the name
   * of the string and that will be applied to the function.
   * @default - SECURE_STRING_NAME
   */
  envVariableName?: string;
};

export {
  NodejsFunctionOptions,
  DynamoDBTableOptions,
  DynamoDBItemOptions,
  SsmSecureStringOptions,
  SsmStringOptions,
};
