import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';

/**
 * Patches two `@aws-cdk/toolkit-lib` internals that make our highly concurrent
 * e2e stack deployments flaky (aws-powertools/powertools-lambda-typescript#5537).
 *
 * After `ExecuteChangeSet`, the toolkit polls `DescribeStacks` until the stack
 * stabilizes. `DescribeStacks` is eventually consistent, so under load a poll
 * can hit a stale replica that still reports the pre-execution
 * `REVIEW_IN_PROGRESS` status. `stabilizeStack` treats that status as terminal
 * (a carve-out meant for abandoned change sets), so `waitForStackDeploy` throws
 * `DeploymentError('... failed to deploy: REVIEW_IN_PROGRESS', 'StackDeployFailed')`
 * even though the stack is deploying fine. The error-diagnosis path in
 * `monitorDeployment` then evaluates `finalState.wrapped` on the pre-deploy
 * `CloudFormationStack` - which holds no stack for a fresh create - and the
 * `wrapped` getter throws `ToolkitError('NoStack', ...)`, masking the original
 * error entirely.
 *
 * Two patches, applied on import:
 * - `waitForStackDeploy` (lib/api/deployments/cfn-api.js) is wrapped to retry
 *   when it throws the spurious `REVIEW_IN_PROGRESS` deployment error, since a
 *   real stack cannot transition back to `REVIEW_IN_PROGRESS` mid-deploy. A
 *   genuinely stuck stack still fails after {@link MAX_STALE_READ_RETRIES}.
 * - The `wrapped` getter on `CloudFormationStack.prototype`
 *   (lib/api/cloudformation/stack-helpers.js) returns an empty description
 *   instead of throwing, so deployment errors on fresh stacks surface as
 *   themselves rather than as `NoStack`.
 *
 * Both fixes are being proposed upstream in aws/aws-cdk-cli; remove this file
 * once a toolkit-lib release includes them. The patch reaches into un-exported
 * modules by absolute path (the package `exports` map blocks deep imports), so
 * a toolkit-lib upgrade that moves these files disables it: it warns and lets
 * the toolkit run unpatched rather than failing every test.
 */

const MAX_STALE_READ_RETRIES = 5;
const DEFAULT_RETRY_DELAY_MS = 5_000;
const PATCHED = Symbol.for(
  '@aws-lambda-powertools/testing-utils.toolkitLibPatched'
);

type IoHelperLike = {
  defaults: {
    debug: (msg: string) => Promise<void>;
  };
};

type WaitForStackDeploy = (
  cfn: unknown,
  ioHelper: IoHelperLike,
  stackName: string,
  stabilizationPollingInterval?: number
) => Promise<unknown>;

type CfnApiModule = {
  waitForStackDeploy: WaitForStackDeploy & { [PATCHED]?: boolean };
};

type StackHelpersModule = {
  CloudFormationStack: {
    prototype: {
      stack?: unknown;
      wrapped: unknown;
    };
  };
};

const isStaleReviewInProgressError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { deploymentErrorCode?: string }).deploymentErrorCode ===
    'StackDeployFailed' &&
  ((error as Error).message ?? '').includes('REVIEW_IN_PROGRESS');

const patchWaitForStackDeploy = (cfnApi: CfnApiModule): void => {
  const original = cfnApi.waitForStackDeploy;
  if (original[PATCHED]) return;
  const patched: WaitForStackDeploy & { [PATCHED]?: boolean } = async (
    cfn,
    ioHelper,
    stackName,
    stabilizationPollingInterval
  ) => {
    let staleReads = 0;
    while (true) {
      try {
        return await original(
          cfn,
          ioHelper,
          stackName,
          stabilizationPollingInterval
        );
      } catch (error) {
        if (
          !isStaleReviewInProgressError(error) ||
          staleReads >= MAX_STALE_READ_RETRIES
        ) {
          throw error;
        }
        staleReads++;
        await ioHelper.defaults.debug(
          `Stack ${stackName} read back as REVIEW_IN_PROGRESS after execute; treating as a stale DescribeStacks read and retrying stabilization (${staleReads}/${MAX_STALE_READ_RETRIES})`
        );
        await setTimeout(
          stabilizationPollingInterval ?? DEFAULT_RETRY_DELAY_MS
        );
      }
    }
  };
  patched[PATCHED] = true;
  cfnApi.waitForStackDeploy = patched;
};

const patchWrappedGetter = (stackHelpers: StackHelpersModule): void => {
  Object.defineProperty(stackHelpers.CloudFormationStack.prototype, 'wrapped', {
    configurable: true,
    get(this: { stack?: unknown }) {
      return this.stack ?? {};
    },
  });
};

try {
  const requireFromCwd = createRequire(join(process.cwd(), 'index.js'));
  const toolkitLibDir = dirname(
    requireFromCwd.resolve('@aws-cdk/toolkit-lib/package.json')
  );
  const cfnApi: CfnApiModule = requireFromCwd(
    join(toolkitLibDir, 'lib/api/deployments/cfn-api.js')
  );
  const stackHelpers: StackHelpersModule = requireFromCwd(
    join(toolkitLibDir, 'lib/api/cloudformation/stack-helpers.js')
  );
  if (
    typeof cfnApi.waitForStackDeploy !== 'function' ||
    typeof stackHelpers.CloudFormationStack !== 'function'
  ) {
    throw new Error('toolkit-lib internals changed shape');
  }
  patchWaitForStackDeploy(cfnApi);
  patchWrappedGetter(stackHelpers);
} catch (error) {
  console.warn(
    `Unable to patch @aws-cdk/toolkit-lib stabilization internals; deploys may flake with spurious NoStack errors (#5537): ${error}`
  );
}
