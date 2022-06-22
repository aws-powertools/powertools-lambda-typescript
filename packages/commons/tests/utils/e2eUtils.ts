// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/** 
 * E2E utils is used by e2e tests. They are helper function that calls either CDK or SDK
 * to interact with services. 
*/
import { App, CfnOutput, Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import * as AWS from 'aws-sdk';

import { InvocationLogs } from './InvocationLogs';

const lambdaClient = new AWS.Lambda();

const testRuntimeKeys = [ 'nodejs12x', 'nodejs14x', 'nodejs16x' ];
export type TestRuntimesKey = typeof testRuntimeKeys[number];
export const TEST_RUNTIMES: Record<TestRuntimesKey, Runtime> = {
  nodejs12x: Runtime.NODEJS_12_X,
  nodejs14x: Runtime.NODEJS_14_X,
  nodejs16x: Runtime.NODEJS_16_X,
};

export type StackWithLambdaFunctionOptions = {
  app: App
  stackName: string
  functionName: string
  functionEntry: string
  tracing?: Tracing
  environment: {[key: string]: string}
  logGroupOutputKey?: string
  runtime: string
};

type FunctionPayload = {[key: string]: string | boolean | number};

export const isValidRuntimeKey = (runtime: string): runtime is TestRuntimesKey => testRuntimeKeys.includes(runtime);

export const createStackWithLambdaFunction = (params: StackWithLambdaFunctionOptions): Stack => {
  
  const stack = new Stack(params.app, params.stackName);
  const testFunction = new lambda.NodejsFunction(stack, `testFunction`, {
    functionName: params.functionName,
    entry: params.functionEntry,
    tracing: params.tracing,
    environment: params.environment,
    runtime: TEST_RUNTIMES[params.runtime as TestRuntimesKey],
  });

  if (params.logGroupOutputKey) {
    new CfnOutput(stack, params.logGroupOutputKey, {
      value: testFunction.logGroup.logGroupName,
    });
  }
  
  return stack;
};

export const generateUniqueName = (name_prefix: string, uuid: string, runtime: string, testName: string): string => 
  `${name_prefix}-${runtime}-${uuid.substring(0,5)}-${testName}`.substring(0, 64);

export const invokeFunction = async (functionName: string, times: number = 1, invocationMode: 'PARALLEL' | 'SEQUENTIAL' = 'PARALLEL', payload: FunctionPayload = {}): Promise<InvocationLogs[]> => {
  const invocationLogs: InvocationLogs[] = [];

  const promiseFactory = (): Promise<void> => {
    const invokePromise = lambdaClient
      .invoke({
        FunctionName: functionName,
        LogType: 'Tail', // Wait until execution completes and return all logs
        Payload: JSON.stringify(payload),
      })
      .promise()
      .then((response) => {
        if (response?.LogResult) {
          invocationLogs.push(new InvocationLogs(response?.LogResult));
        } else {
          throw new Error('No LogResult field returned in the response of Lambda invocation. This should not happen.');
        }
      });

    return invokePromise;
  };
  
  const promiseFactories = Array.from({ length: times }, () => promiseFactory );
  const invocation = invocationMode == 'PARALLEL'
    ? Promise.all(promiseFactories.map(factory => factory()))
    : chainPromises(promiseFactories);
  await invocation;

  return invocationLogs; 
};

const chainPromises = async (promiseFactories: (() => Promise<void>)[]) : Promise<void> => {
  let chain = Promise.resolve();
  promiseFactories.forEach(factory => chain = chain.then(factory));

  return chain;
};
