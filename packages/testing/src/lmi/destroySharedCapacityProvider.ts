import { buildSharedCapacityProviderStack } from './sharedCapacityProviderStack.js';

/**
 * Destroy the run-scoped shared LMI capacity provider stack for the current
 * architecture.
 *
 * Intended to run as a workflow teardown job step (with `if: always()` so the
 * stack is removed even when the test jobs fail):
 * ```yaml
 * - run: node packages/testing/lib/esm/lmi/destroySharedCapacityProvider.js
 *   env:
 *     ARCH: ${{ matrix.arch }}
 * ```
 * The stack name is deterministic for a given run id and architecture, so the
 * teardown job reconstructs the same stack the setup job deployed.
 */
const main = async (): Promise<void> => {
  const testStack = buildSharedCapacityProviderStack();
  await testStack.destroy();
  console.log(`Destroyed ${testStack.stack.stackName}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
