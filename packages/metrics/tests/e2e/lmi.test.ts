import { Console } from 'node:console';
import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { lmiFunctionStackTestName } from '@aws-lambda-powertools/testing-utils/lmi';
import { TestLmiCapacityProvider } from '@aws-lambda-powertools/testing-utils/resources/capacity-provider';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import promiseRetry from 'promise-retry';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { EmfOutput } from '../../src/types/index.js';
import { MetricsTestNodejsFunction } from '../helpers/resources.js';
import { commonEnvironmentVars, RESOURCE_NAME_PREFIX } from './constants.js';

type IsolationResult = {
  invocationId: string;
  executionEnvId: string;
  sawPeer: boolean;
  initializationType: string;
  maxConcurrency: string;
  payloads: EmfOutput[];
};

type InvocationPayload = {
  invocationId: string;
  metricValue: number;
  role: 'warmup' | 'test';
};

/**
 * In this e2e test for Metrics, we test the InvokeStore-backed isolation of
 * metrics and metadata on Lambda Managed Instances (LMI), where multiple
 * invocations run concurrently within the same execution environment.
 *
 * The function is associated with a small (12 vCPU) capacity provider. The
 * LMI scheduler prefers scaling out to fresh execution environments over
 * multiplexing invocations into busy ones, so forcing a genuine overlap does
 * not depend on precisely sizing the fleet: instead the handler blocks on a
 * module-scoped promise barrier (see `lmi.test.functionCode.ts`) until a peer
 * invocation lands in the same environment. Holding every invocation open at
 * once keeps environments busy long enough that the scheduler multiplexes at
 * least one pair together, which is all the assertion needs. Without
 * InvokeStore isolation, the overlapping invocations' metric values and
 * metadata would bleed into each other's EMF payload.
 *
 * Exact environment counts are not asserted and vary with fleet size and load
 * — in CI both Node.js versions share one per-architecture provider, so a run
 * may spread these invocations across a couple of dozen environments and still
 * multiplex a handful; a local run against an ephemeral provider looks
 * different again. The barrier is what guarantees an overlap regardless.
 *
 * The Invoke API does not support Tail logs for capacity provider functions
 * and CloudWatch log delivery is asynchronous, so the handler intercepts its
 * own process.stdout stream to capture the EMF payloads Metrics emits and
 * returns them in the response payload, making collection fully deterministic
 * while exercising the production write path.
 */
// Same pattern as TestStack's ioHost: a dedicated Console writing straight to
// the process streams bypasses vitest's output capture, so these phase
// markers appear in real time. The invocation phase takes minutes with no
// other output, and when it fails these markers are the only way to tell
// which phase died.
const testConsole = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
});

describe('Metrics E2E - Lambda Managed Instances', () => {
  // Fire enough concurrent invocations, all held open on the barrier, that
  // the scheduler multiplexes at least one pair into a shared execution
  // environment rather than giving every invocation its own. The count only
  // needs to comfortably exceed the fleet's environment count; the barrier,
  // not a precise number, is what forces the overlap.
  const invocationCount = 30;

  // The test name embeds an `Lmi` marker and the workflow run id
  // (`Lmi-<runId>`) so the teardown job can find and delete this stack if the
  // cell is cancelled or times out before its own `afterAll` runs, leaving
  // the function attached to the shared capacity provider.
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: lmiFunctionStackTestName(),
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'lmi.test.functionCode.ts'
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
  new MetricsTestNodejsFunction(
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

  const invokeOnce = async (
    payload: InvocationPayload
  ): Promise<IsolationResult> => {
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

  // Each invocation stores a distinct metric value, so a payload carrying any
  // other invocation's value, or several values, reveals shared state
  const invocations: InvocationPayload[] = Array.from(
    { length: invocationCount },
    (_, index) => ({
      invocationId: `inv-${index}`,
      metricValue: index + 1,
      role: 'test',
    })
  );
  let results: IsolationResult[];

  beforeAll(async () => {
    await testStack.deploy();

    functionName = testStack.findAndGetStackOutputValue('LmiIsolation');
    testConsole.log(
      `[lmi] stack deployed (${sharedCapacityProviderArn ? 'shared' : 'ephemeral'} capacity provider), warming up ${functionName}...`
    );

    // The first invocation on a fresh capacity provider may have to wait
    // for an EC2 instance to boot, so retry until capacity is available
    await promiseRetry(
      async (retry, attempt) => {
        await invokeOnce({
          invocationId: 'warmup',
          metricValue: 0,
          role: 'warmup',
        }).catch((error) => {
          testConsole.log(
            `[lmi] warmup attempt ${attempt} failed, retrying...`
          );
          retry(error);
        });
      },
      {
        retries: 10,
        factor: 2,
        minTimeout: 5_000,
        maxTimeout: 60_000,
      }
    );
    testConsole.log(
      `[lmi] warmup complete, firing ${invocationCount} concurrent invocations...`
    );

    // Every invocation blocks inside the handler until a second invocation
    // lands in the same execution environment. Dispatching all of them
    // simultaneously saturates the fleet, which forces the scheduler to
    // multiplex the overflow into busy environments
    results = await Promise.all(invocations.map(invokeOnce));

    const multiplexed = results.filter((result) => result.sawPeer).length;
    const environments = new Set(
      results.map((result) => result.executionEnvId)
    );
    testConsole.log(
      `[lmi] ${results.length}/${invocationCount} responses; ${multiplexed} multiplexed across ${environments.size} execution environments`
    );
  }, 1_200_000); // VPC + capacity provider + instance boot can exceed the default hook timeout

  it('isolates metrics and metadata across concurrent invocations in the same execution environment', () => {
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

    // Each invocation emitted exactly one payload carrying its own metadata
    // key, and that payload holds only its own metric with only its own
    // value: without isolation, concurrent addMetric and addMetadata calls
    // within a shared environment would bleed across the invocations blocked
    // on the barrier, showing up as a foreign or accumulated value
    for (const [index, result] of results.entries()) {
      expect(result.invocationId).toBe(invocations[index].invocationId);
      expect(result.payloads).toHaveLength(1);
      const [payload] = result.payloads;
      expect(payload.LmiIsolation).toBe(invocations[index].metricValue);
      expect(payload._aws.CloudWatchMetrics).toStrictEqual([
        {
          Namespace: commonEnvironmentVars.EXPECTED_NAMESPACE,
          Dimensions: [['service']],
          Metrics: [{ Name: 'LmiIsolation', Unit: 'Count' }],
        },
      ]);
    }
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, 1_200_000);
});
