import { join } from 'node:path';
import {
  invokeFunctionOnce,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { TestLmiCapacityProvider } from '@aws-lambda-powertools/testing-utils/resources/capacity-provider';
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import promiseRetry from 'promise-retry';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LoggerTestNodejsFunction } from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX, STACK_OUTPUT_LOG_GROUP } from './constants.js';

type IsolationLog = {
  invocationKey: string;
  executionEnvId: string;
  sawPeer: boolean;
  initializationType: string;
  maxConcurrency: string;
};

/**
 * In this e2e test for Logger, we test the InvokeStore-backed isolation of log
 * attributes on Lambda Managed Instances (LMI), where multiple invocations run
 * concurrently within the same execution environment.
 *
 * The function is associated with an ephemeral capacity provider whose fleet
 * is capped at the minimum size (12 vCPUs, which in practice hosts 8 of this
 * function's ~1 vCPU execution environments). The LMI scheduler prefers
 * scaling out to fresh environments over multiplexing, so the test fires more
 * simultaneous invocations than the fleet can host as dedicated environments,
 * forcing the overflow to be multiplexed into busy ones. The handler blocks
 * on a module-scoped promise barrier (see `lmi.test.FunctionCode.ts`) until a
 * peer invocation lands in the same environment, proving a genuine overlap.
 * Without InvokeStore isolation, the overlapping invocations' appended keys
 * would bleed into each other's log output.
 */
describe.runIf(process.env.RUN_LMI_TESTS === 'true')(
  'Logger E2E - Lambda Managed Instances',
  () => {
    // The LMI scheduler scales out to fresh execution environments until the
    // capacity provider's fleet is saturated (8 environments with a 12 vCPU
    // cap and ~1 vCPU environments) and only then multiplexes concurrent
    // invocations into busy environments, so we need comfortably more
    // concurrent invocations than the fleet can host
    const invocationCount = 30;

    const testStack = new TestStack({
      stackNameProps: {
        stackNamePrefix: RESOURCE_NAME_PREFIX,
        testName: 'Lmi',
      },
    });

    // Location of the lambda function code
    const lambdaFunctionCodeFilePath = join(
      __dirname,
      'lmi.test.FunctionCode.ts'
    );

    const capacityProvider = new TestLmiCapacityProvider(testStack);
    new LoggerTestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        // ACTIVE tracing compatibility with LMI is unverified
        tracing: Tracing.DISABLED,
      },
      {
        logGroupOutputKey: STACK_OUTPUT_LOG_GROUP,
        nameSuffix: 'LmiIsolation',
        lmi: {
          capacityProvider,
          perExecutionEnvironmentMaxConcurrency: 10,
        },
      }
    );

    let functionName: string;
    let logGroupName: string;
    let invokeStartTime: number;

    beforeAll(async () => {
      await testStack.deploy();

      functionName = testStack.findAndGetStackOutputValue('LmiIsolation');
      logGroupName = testStack.findAndGetStackOutputValue(
        STACK_OUTPUT_LOG_GROUP
      );

      // The first invocation on a fresh capacity provider may have to wait
      // for an EC2 instance to boot, so retry until capacity is available
      await promiseRetry(
        async (retry) => {
          await invokeFunctionOnce({
            functionName,
            payload: { invocationId: 'warmup', role: 'warmup' },
            // Tail logs are not supported on capacity provider functions
            includeTailLogs: false,
          }).catch(retry);
        },
        {
          retries: 10,
          factor: 2,
          minTimeout: 5_000,
          maxTimeout: 60_000,
        }
      );

      invokeStartTime = Date.now();
      // Every invocation blocks inside the handler until a second invocation
      // lands in the same execution environment. Dispatching all of them
      // simultaneously saturates the fleet, which forces the scheduler to
      // multiplex the overflow into busy environments
      await Promise.all(
        Array.from({ length: invocationCount }, (_, index) =>
          invokeFunctionOnce({
            functionName,
            payload: { invocationId: `inv-${index}`, role: 'test' },
            includeTailLogs: false,
          })
        )
      );
    }, 1_200_000); // VPC + capacity provider + instance boot can exceed the default hook timeout

    it('isolates log attributes across concurrent invocations in the same execution environment', async () => {
      // Collect the isolation logs from CloudWatch, retrying until every
      // invocation's log has been ingested
      const client = new CloudWatchLogsClient({});
      const isolationLogs = await promiseRetry(
        async (retry) => {
          const logs: IsolationLog[] = [];
          let nextToken: string | undefined;
          do {
            const response = await client.send(
              new FilterLogEventsCommand({
                logGroupName,
                filterPattern: '"LMI isolation test"',
                startTime: invokeStartTime,
                nextToken,
              })
            );
            for (const event of response.events ?? []) {
              const log = JSON.parse(event.message ?? '{}') as IsolationLog;
              if (log.invocationKey?.startsWith('inv-')) {
                logs.push(log);
              }
            }
            nextToken = response.nextToken;
          } while (nextToken);

          if (logs.length < invocationCount) {
            return retry(
              new Error(
                `Expected ${invocationCount} isolation logs, got ${logs.length}`
              )
            );
          }
          return logs;
        },
        { retries: 10, factor: 1, minTimeout: 5_000 }
      );

      expect(isolationLogs).toHaveLength(invocationCount);

      // The function actually ran on Lambda Managed Instances with the
      // concurrency path active: AWS_LAMBDA_MAX_CONCURRENCY drives
      // shouldUseInvokeStore() in @aws-lambda-powertools/commons
      for (const log of isolationLogs) {
        expect(log.initializationType).toBe('lambda-managed-instances');
        expect(log.maxConcurrency).toBe('10');
      }

      // At least one pair of invocations genuinely overlapped inside the
      // same execution environment: they observed each other through the
      // module-scoped barrier. The scheduler may still scale out some of
      // the invocations to other environments; that's fine as long as a
      // real overlap happened somewhere.
      expect(isolationLogs.some((log) => log.sawPeer === true)).toBe(true);

      // Each invocation logged exactly its own key: without isolation,
      // concurrent appendKeys calls within the shared environment would
      // bleed across invocations while they were blocked on the barrier
      const invocationKeys = isolationLogs
        .map((log) => log.invocationKey)
        .sort((a, b) =>
          Number(a.split('-')[1]) > Number(b.split('-')[1]) ? 1 : -1
        );
      expect(invocationKeys).toEqual(
        Array.from({ length: invocationCount }, (_, index) => `inv-${index}`)
      );
    });

    afterAll(async () => {
      if (!process.env.DISABLE_TEARDOWN) {
        await testStack.destroy();
      }
    }, 1_200_000);
  }
);
