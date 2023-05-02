/**
 * E2E utils is used by e2e tests. They are helper function that calls either CDK or SDK
 * to interact with services.
 */
import { App, CfnOutput, Stack, Duration } from 'aws-cdk-lib';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { fromUtf8 } from '@aws-sdk/util-utf8-node';

import { InvocationLogs } from './InvocationLogs';

const lambdaClient = new LambdaClient({});

const testRuntimeKeys = ['nodejs14x', 'nodejs16x', 'nodejs18x'];
export type TestRuntimesKey = (typeof testRuntimeKeys)[number];
export const TEST_RUNTIMES: Record<TestRuntimesKey, Runtime> = {
  nodejs14x: Runtime.NODEJS_14_X,
  nodejs16x: Runtime.NODEJS_16_X,
  nodejs18x: Runtime.NODEJS_18_X,
};

export type StackWithLambdaFunctionOptions = {
  app: App;
  stackName: string;
  functionName: string;
  functionEntry: string;
  tracing?: Tracing;
  environment: { [key: string]: string };
  logGroupOutputKey?: string;
  runtime: string;
  bundling?: NodejsFunctionProps['bundling'];
  layers?: NodejsFunctionProps['layers'];
  timeout?: Duration;
};

type FunctionPayload = { [key: string]: string | boolean | number };

export const isValidRuntimeKey = (
  runtime: string
): runtime is TestRuntimesKey => testRuntimeKeys.includes(runtime);

export const createStackWithLambdaFunction = (
  params: StackWithLambdaFunctionOptions
): Stack => {
  const stack = new Stack(params.app, params.stackName);
  const testFunction = new NodejsFunction(stack, `testFunction`, {
    functionName: params.functionName,
    entry: params.functionEntry,
    tracing: params.tracing,
    environment: params.environment,
    runtime: TEST_RUNTIMES[params.runtime as TestRuntimesKey],
    bundling: params.bundling,
    layers: params.layers,
    logRetention: RetentionDays.ONE_DAY,
    timeout: params.timeout,
  });

  if (params.logGroupOutputKey) {
    new CfnOutput(stack, params.logGroupOutputKey, {
      value: testFunction.logGroup.logGroupName,
    });
  }

  return stack;
};

export const generateUniqueName = (
  name_prefix: string,
  uuid: string,
  runtime: string,
  testName: string
): string =>
  `${name_prefix}-${runtime}-${uuid.substring(0, 5)}-${testName}`.substring(
    0,
    64
  );

export const invokeFunction = async (
  functionName: string,
  times = 1,
  invocationMode: 'PARALLEL' | 'SEQUENTIAL' = 'PARALLEL',
  payload: FunctionPayload = {}
): Promise<InvocationLogs[]> => {
  const invocationLogs: InvocationLogs[] = [];

  const promiseFactory = (index?: number): Promise<void> => {
    const invokePromise = lambdaClient
      .send(
        new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          LogType: 'Tail', // Wait until execution completes and return all logs
          Payload: fromUtf8(
            JSON.stringify({
              invocation: index,
              ...payload,
            })
          ),
        })
      )
      .then((response) => {
        if (response?.LogResult) {
          invocationLogs.push(new InvocationLogs(response?.LogResult));
        } else {
          throw new Error(
            'No LogResult field returned in the response of Lambda invocation. This should not happen.'
          );
        }
      });

    return invokePromise;
  };

  const promiseFactories = Array.from({ length: times }, () => promiseFactory);
  const invocation =
    invocationMode == 'PARALLEL'
      ? Promise.all(promiseFactories.map((factory, index) => factory(index)))
      : chainPromises(promiseFactories);
  await invocation;

  return invocationLogs;
};

const chainPromises = async (
  promiseFactories: ((index?: number) => Promise<void>)[]
): Promise<void> => {
  for (let index = 0; index < promiseFactories.length; index++) {
    await promiseFactories[index](index);
  }
};
