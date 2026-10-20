import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { fromUtf8 } from '@smithy/util-utf8';
import { TestInvocationLogs } from './TestInvocationLogs.js';
import type { InvokeTestFunctionOptions } from './types.js';

const lambdaClient = new LambdaClient({});

/**
 * Invoke a Lambda function once and return the logs.
 *
 * `LogType: 'Tail'` is not supported on functions configured with a Lambda
 * Managed Instances capacity provider — the invoke is rejected — so this
 * helper cannot be used to invoke such functions. LMI suites invoke their
 * functions directly and collect logs by other means (e.g. from the response
 * payload) instead.
 */
const invokeFunctionOnce = async ({
  functionName,
  payload = {},
}: Omit<
  InvokeTestFunctionOptions,
  'times' | 'invocationMode'
>): Promise<TestInvocationLogs> => {
  const result = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      // Wait until execution completes and return all logs
      LogType: 'Tail',
      Payload: fromUtf8(JSON.stringify(payload)),
    })
  );

  if (result?.LogResult) {
    return new TestInvocationLogs(result?.LogResult);
  }
  return new TestInvocationLogs('');
};

/**
 * Invoke a Lambda function multiple times and return the logs
 *
 * When specifying a payload, you can either pass a single object that will be used for all invocations,
 * or an array of objects that will be used for each invocation. If you pass an array, the length of the
 * array must be the same as the times parameter.
 */
const invokeFunction = async ({
  functionName,
  times = 1,
  invocationMode = 'PARALLEL',
  payload = {},
}: InvokeTestFunctionOptions): Promise<TestInvocationLogs[]> => {
  const invocationLogs: TestInvocationLogs[] = [];

  if (payload && Array.isArray(payload) && payload.length !== times) {
    throw new Error(
      'The payload array must have the same length as the times parameter.'
    );
  }

  if (invocationMode === 'PARALLEL') {
    const invocationPromises = Array.from(
      { length: times },
      () => invokeFunctionOnce
    );

    invocationLogs.push(
      ...(await Promise.all(
        invocationPromises.map((invoke, index) => {
          const invocationPayload = Array.isArray(payload)
            ? payload[index]
            : payload;

          return invoke({
            functionName,
            payload: invocationPayload,
          });
        })
      ))
    );
  } else {
    for (let index = 0; index < times; index++) {
      const invocationPayload = Array.isArray(payload)
        ? payload[index]
        : payload;
      invocationLogs.push(
        await invokeFunctionOnce({
          functionName,
          payload: invocationPayload,
        })
      );
    }
  }

  return invocationLogs;
};

export { invokeFunction, invokeFunctionOnce };
