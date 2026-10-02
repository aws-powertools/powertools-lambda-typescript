import { Console } from 'node:console';
import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { lmiFunctionStackTestName } from '@aws-lambda-powertools/testing-utils/lmi';
import { TestLmiCapacityProvider } from '@aws-lambda-powertools/testing-utils/resources/capacity-provider';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import promiseRetry from 'promise-retry';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createIsolationInvocation,
  type IsolationEvent,
  type IsolationResult,
} from '../helpers/lmi.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

const testConsole = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
});

// Run the variants sequentially, releasing each function's capacity before
// deploying the next. A single worker per environment makes module scope shared;
// 30 concurrent invocations on at most 4 environments force overlap at the barrier.
describe.each([
  { name: 'standard SQS', handler: 'handler', fifo: false },
  { name: 'SQS FIFO', handler: 'fifoHandler', fifo: true },
])('Batch E2E - Lambda Managed Instances ($name)', ({ handler, fifo }) => {
  const invocationCount = 30;
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: lmiFunctionStackTestName(),
    },
  });
  const sharedCapacityProviderArn =
    process.env.LMI_CAPACITY_PROVIDER_ARN?.trim();
  const capacityProvider =
    sharedCapacityProviderArn || new TestLmiCapacityProvider(testStack);
  new TestNodejsFunction(
    testStack,
    {
      entry: join(__dirname, 'lmi.test.functionCode.ts'),
      handler,
      tracing: Tracing.DISABLED,
      environment: { AWS_LAMBDA_NODEJS_WORKER_COUNT: '1' },
    },
    {
      nameSuffix: 'LmiIsolation',
      lmi: {
        capacityProvider,
        perExecutionEnvironmentMaxConcurrency: 10,
        minExecutionEnvironments: 3,
        maxExecutionEnvironments: 4,
      },
    }
  );

  const lambdaClient = new LambdaClient({});
  let functionName: string;
  let results: IsolationResult[];
  const invocations = Array.from({ length: invocationCount }, (_, index) =>
    createIsolationInvocation(index, fifo)
  );

  /** Invokes the published LMI function and rejects runtime failures. */
  const invokeOnce = async (
    event: IsolationEvent
  ): Promise<IsolationResult> => {
    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(event),
      })
    );
    if (response.FunctionError) {
      throw new Error(
        `Invocation ${event.invocationId} failed: ${response.FunctionError}; ${Buffer.from(response.Payload ?? []).toString()}`
      );
    }
    return JSON.parse(Buffer.from(response.Payload ?? []).toString());
  };

  beforeAll(async () => {
    await testStack.deploy();
    functionName = testStack.findAndGetStackOutputValue('LmiIsolation');
    testConsole.log(
      `[lmi] ${handler}: stack deployed, warming up ${functionName}...`
    );
    await promiseRetry(
      async (retry, attempt) => {
        await invokeOnce({ ...invocations[0].event, role: 'warmup' }).catch(
          (error) => {
            testConsole.log(
              `[lmi] warmup attempt ${attempt} failed, retrying...`
            );
            retry(error);
          }
        );
      },
      { retries: 10, factor: 2, minTimeout: 5_000, maxTimeout: 60_000 }
    );
    testConsole.log(
      `[lmi] ${handler}: firing ${invocationCount} concurrent invocations...`
    );
    results = await Promise.all(
      invocations.map(({ event }) => invokeOnce(event))
    );
    testConsole.log(
      `[lmi] ${handler}: ${results.filter((result) => result.sawPeer).length}/${invocationCount} invocations observed a peer across ${new Set(results.map((result) => result.executionEnvId)).size} environments`
    );
  }, 1_200_000);

  it('isolates records, handlers, failures, and failed groups across overlapping invocations', () => {
    // Assess
    expect(results).toHaveLength(invocationCount);
    expect(results.some((result) => result.sawPeer)).toBe(true);
    for (const [index, result] of results.entries()) {
      const { event, expectedFailedMessageIds, expectedProcessedMessageIds } =
        invocations[index];
      expect(result.initializationType).toBe('lambda-managed-instances');
      expect(result.maxConcurrency).toBe('10');
      expect(result.invocationId).toBe(event.invocationId);
      expect(result.receivedMessageIds).toEqual(
        event.Records.map((record) => record.messageId)
      );
      expect(result.processedMessageIds).toEqual(expectedProcessedMessageIds);
      expect(result.failedMessageIds).toHaveLength(
        expectedFailedMessageIds.length
      );
      expect(new Set(result.failedMessageIds)).toEqual(
        new Set(expectedFailedMessageIds)
      );
      for (const messageId of result.failedMessageIds) {
        expect(messageId.startsWith(`${event.invocationId}-msg-`)).toBe(true);
      }
    }
  });

  afterAll(async () => {
    lambdaClient.destroy();
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, 1_200_000);
});
