import type { TableProps, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import type { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { App, Stack } from 'aws-cdk-lib';
import { LogLevel } from './constants.js';

interface ExtraTestProps {
  /**
   * The suffix to be added to the resource name.
   *
   * For example, if the resource name is `fn-12345` and the suffix is `BasicFeatures`,
   * the output will be `fn-12345-BasicFeatures`.
   *
   * Note that the maximum length of the name is 64 characters, so the suffix might be truncated.
   */
  nameSuffix: string;
}

type TestDynamodbTableProps = Omit<
  TableProps,
  'removalPolicy' | 'tableName' | 'billingMode' | 'partitionKey'
> & {
  partitionKey?: {
    name: string;
    type: AttributeType;
  };
};

type TestNodejsFunctionProps = Omit<
  NodejsFunctionProps,
  'logRetention' | 'runtime' | 'functionName'
>;

type InvokeTestFunctionOptions = {
  functionName: string;
  times?: number;
  invocationMode?: 'PARALLEL' | 'SEQUENTIAL';
  payload?: Record<string, unknown> | Array<Record<string, unknown>>;
};

type ErrorField = {
  name: string;
  message: string;
  stack: string;
};

type FunctionLog = {
  level: keyof typeof LogLevel;
  error: ErrorField;
} & { [key: string]: unknown };

type StackNameProps = {
  /**
   * Prefix for the stack name.
   */
  stackNamePrefix: string;
  /**
   * Name of the test.
   */
  testName: string;
};

interface TestStackProps {
  /**
   * Name of the test stack.
   */
  stackNameProps: StackNameProps;
  /**
   * Reference to the AWS CDK App object.
   * @default new App()
   */
  app?: App;
  /**
   * Reference to the AWS CDK Stack object.
   * @default new Stack(this.app, stackName)
   */
  stack?: Stack;
}

export type {
  ExtraTestProps,
  TestDynamodbTableProps,
  TestNodejsFunctionProps,
  InvokeTestFunctionOptions,
  ErrorField,
  FunctionLog,
  StackNameProps,
  TestStackProps,
};
