import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestLmiCapacityProvider } from '@aws-lambda-powertools/testing-utils/resources/capacity-provider';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import promiseRetry from 'promise-retry';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LoggerTestNodejsFunction } from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

type IsolationResult = {
  invocationId: string;
  executionEnvId: string;
  sawPeer: boolean;
  initializationType: string;
  maxConcurrency: string;
  logs: Array<{
    message: string;
    invocationKey?: string;
    function_request_id?: string;
  }>;
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
 *
 * The Invoke API does not support Tail logs for capacity provider functions
 * and CloudWatch log delivery is asynchronous, so the handler intercepts its
 * own process.stdout stream to capture the log lines the Logger emits and
 * returns them in the response payload, making log collection fully
 * deterministic while exercising the production log write path.
 */
describe('Logger E2E - Lambda Managed Instances', () => {
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

  // In CI a setup job deploys one shared capacity provider per architecture
  // (see lmi/deploySharedCapacityProvider.ts in the testing package) and
  // passes its ARN via the environment; otherwise (e.g. local runs) fall back
  // to an ephemeral capacity provider that lives and dies with this suite's
  // stack. The env var is treated as unset when empty so that a
  // mis-referenced workflow output degrades to the fallback instead of an
  // invalid ARN.
  const sharedCapacityProviderArn =
    process.env.LMI_CAPACITY_PROVIDER_ARN?.trim();
  const capacityProvider = sharedCapacityProviderArn
    ? sharedCapacityProviderArn
    : new TestLmiCapacityProvider(testStack);
  new LoggerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      // ACTIVE tracing compatibility with LMI is unverified
      tracing: Tracing.DISABLED,
    },
    {
      nameSuffix: 'LmiIsolation',
      lmi: {
        capacityProvider,
        perExecutionEnvironmentMaxConcurrency: 10,
      },
    }
  );

  const lambdaClient = new LambdaClient({});
  let functionName: string;

  const invokeOnce = async (payload: {
    invocationId: string;
    role: 'warmup' | 'test';
  }): Promise<IsolationResult> => {
    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload),
      })
    );
    if (response.FunctionError) {
      throw new Error(
        `Invocation ${payload.invocationId} failed: ${response.FunctionError}`
      );
    }
    return JSON.parse(
      Buffer.from(response.Payload ?? new Uint8Array()).toString()
    );
  };

  let results: IsolationResult[];

  beforeAll(async () => {
    await testStack.deploy();

    functionName = testStack.findAndGetStackOutputValue('LmiIsolation');

    // The first invocation on a fresh capacity provider may have to wait
    // for an EC2 instance to boot, so retry until capacity is available
    await promiseRetry(
      async (retry) => {
        await invokeOnce({ invocationId: 'warmup', role: 'warmup' }).catch(
          retry
        );
      },
      {
        retries: 10,
        factor: 2,
        minTimeout: 5_000,
        maxTimeout: 60_000,
      }
    );

    // Every invocation blocks inside the handler until a second invocation
    // lands in the same execution environment. Dispatching all of them
    // simultaneously saturates the fleet, which forces the scheduler to
    // multiplex the overflow into busy environments
    results = await Promise.all(
      Array.from({ length: invocationCount }, (_, index) =>
        invokeOnce({ invocationId: `inv-${index}`, role: 'test' })
      )
    );
  }, 1_200_000); // VPC + capacity provider + instance boot can exceed the default hook timeout

  it('isolates log attributes across concurrent invocations in the same execution environment', () => {
    expect(results).toHaveLength(invocationCount);

    // The function actually ran on Lambda Managed Instances with the
    // concurrency path active: AWS_LAMBDA_MAX_CONCURRENCY drives
    // shouldUseInvokeStore() in @aws-lambda-powertools/commons
    for (const result of results) {
      expect(result.initializationType).toBe('lambda-managed-instances');
      expect(result.maxConcurrency).toBe('10');
    }

    // At least one pair of invocations genuinely overlapped inside the
    // same execution environment: they observed each other through the
    // module-scoped barrier. The scheduler may still scale out some of
    // the invocations to other environments; that's fine as long as a
    // real overlap happened somewhere.
    expect(results.some((result) => result.sawPeer === true)).toBe(true);

    // Each invocation's captured logs carry exactly its own key: without
    // isolation, concurrent appendKeys calls within a shared environment
    // would bleed across the invocations blocked on the barrier
    for (const result of results) {
      const isolationLogs = result.logs.filter(
        (log) => log.message === 'LMI isolation test'
      );
      expect(isolationLogs).toHaveLength(1);
      expect(isolationLogs[0].invocationKey).toBe(result.invocationId);
    }
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, 1_200_000);
});
