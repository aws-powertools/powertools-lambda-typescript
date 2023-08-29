import type { TestStack } from '@aws-lambda-powertools/testing-utils';
import {
  concatenateResourceName,
  defaultRuntime,
  TestNodejsFunction,
  TEST_RUNTIMES,
} from '@aws-lambda-powertools/testing-utils';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { randomUUID } from 'node:crypto';
import { commonEnvironmentVariables } from '../e2e/constants';

const functionFactory = ({
  testStack,
  testName,
  functionSuffix,
  lambdaFunctionCodeFilePath,
  handler,
  environment = {},
}: {
  testStack: TestStack;
  testName: string;
  functionSuffix: string;
  lambdaFunctionCodeFilePath: string;
  handler?: string;
  environment?: Record<string, string>;
}): TestNodejsFunction => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  const functionName = concatenateResourceName({
    testName,
    resourceName: functionSuffix,
  });

  return new TestNodejsFunction(
    testStack.stack,
    `fn-${randomUUID().substring(0, 5)}`,
    {
      functionName,
      entry: lambdaFunctionCodeFilePath,
      runtime: TEST_RUNTIMES[runtime as keyof typeof TEST_RUNTIMES],
      handler,
      environment: {
        POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
        POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
        POWERTOOLS_TRACE_ENABLED: 'true',
        EXPECTED_SERVICE_NAME: functionName,
        ...commonEnvironmentVariables,
        ...environment,
      },
    },
    {
      fnOutputKey: functionSuffix,
    }
  );
};

const tableFactory = ({
  testStack,
  testName,
  tableSuffix,
}: {
  testStack: TestStack;
  testName: string;
  tableSuffix: string;
}): Table =>
  new Table(testStack.stack, `table-${randomUUID().substring(0, 5)}`, {
    tableName: concatenateResourceName({
      testName,
      resourceName: tableSuffix,
    }),
    partitionKey: {
      name: 'id',
      type: AttributeType.STRING,
    },
    billingMode: BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
  });

export { functionFactory, tableFactory };
