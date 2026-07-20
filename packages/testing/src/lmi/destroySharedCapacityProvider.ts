import { TEST_ARCHITECTURES } from '../constants.js';
import { buildSharedCapacityProviderStack } from './sharedCapacityProviderStack.js';

/**
 * Destroy the run-scoped shared LMI capacity provider stacks, one per
 * architecture, concurrently.
 *
 * Intended to run as a workflow teardown job step (with `if: always()` so the
 * stacks are removed even when the test jobs fail):
 * ```yaml
 * - run: node packages/testing/lib/esm/lmi/destroySharedCapacityProvider.js
 * ```
 * The stack names are deterministic for a given run id and architecture, so
 * the teardown job reconstructs the same stacks the setup job deployed. Each
 * destroy failure is reported but does not prevent the other architecture's
 * teardown from being attempted.
 */
const main = async (): Promise<void> => {
  const results = await Promise.allSettled(
    (Object.keys(TEST_ARCHITECTURES) as (keyof typeof TEST_ARCHITECTURES)[])
      // Build all stacks synchronously before any destroy starts:
      // construction reads/writes the ambient ARCH environment variable, so
      // it must not interleave with other builds
      .map((architecture) => buildSharedCapacityProviderStack(architecture))
      .map(async (testStack) => {
        await testStack.destroy();
        console.log(`Destroyed ${testStack.stack.stackName}`);
      })
  );
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(result.reason);
      process.exitCode = 1;
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
