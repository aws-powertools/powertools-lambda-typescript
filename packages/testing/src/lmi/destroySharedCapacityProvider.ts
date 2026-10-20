import { TEST_ARCHITECTURES } from '../constants.js';
import { buildSharedCapacityProviderStack } from './sharedCapacityProviderStack.js';
import { sweepOrphanedFunctionStacks } from './sweepOrphanedFunctionStacks.js';

/**
 * Destroy the run-scoped shared LMI capacity provider stacks, one per
 * architecture, concurrently.
 *
 * Intended to run as a workflow teardown job step (with `if: always()` so the
 * stacks are removed even when the test jobs fail):
 * ```yaml
 * - run: npm run lmi:destroy -w packages/testing
 * ```
 * The stack names are deterministic for a given run id and architecture, so
 * the teardown job reconstructs the same stacks the setup job deployed. Each
 * destroy failure is reported but does not prevent the other architecture's
 * teardown from being attempted.
 */
const destroyProviderStacks = async (): Promise<void> => {
  const results = await Promise.allSettled(
    (Object.keys(TEST_ARCHITECTURES) as (keyof typeof TEST_ARCHITECTURES)[])
      .map((architecture) => buildSharedCapacityProviderStack(architecture))
      .map(async (testStack) => {
        await testStack.destroy();
        console.log(`Destroyed ${testStack.stack.stackName}`);
      })
  );
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );
  if (rejected.length > 0) {
    for (const failure of rejected) {
      console.error(failure.reason);
    }
    throw new AggregateError(
      rejected.map((failure) => failure.reason),
      'One or more shared capacity provider stacks failed to delete'
    );
  }
};

const main = async (): Promise<void> => {
  // A function attached to a capacity provider by ARN keeps the provider's
  // ENIs in use, and that cross-stack relationship is invisible to
  // CloudFormation, so a function stack orphaned by a cancelled or timed-out
  // cell would make the provider-stack delete fail. Sweep any such leftover
  // function stacks first; on a healthy run this is a no-op because each
  // suite's own `afterAll` already deleted its stack.
  const swept = await sweepOrphanedFunctionStacks();
  if (swept.length > 0) {
    console.log(`Swept orphaned LMI function stacks: ${swept.join(', ')}`);
  }

  try {
    await destroyProviderStacks();
  } catch (error) {
    // A first failure is most often a transient throttle or an ENI still
    // detaching from a just-swept function stack; one retry clears both.
    console.error('Retrying shared capacity provider teardown after error:');
    console.error(error);
    await destroyProviderStacks();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
