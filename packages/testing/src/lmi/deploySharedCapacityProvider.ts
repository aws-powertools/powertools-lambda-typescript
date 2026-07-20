import { buildSharedCapacityProviderStack } from './sharedCapacityProviderStack.js';

/**
 * Deploy the run-scoped shared LMI capacity provider stack for the current
 * architecture.
 *
 * Intended to run as a workflow setup job step (after the packages have been
 * built):
 * ```yaml
 * - run: node packages/testing/lib/esm/lmi/deploySharedCapacityProvider.js
 *   env:
 *     ARCH: x86_64
 * ```
 * The ARN is deliberately not exposed as a job output: it contains the AWS
 * account id, which CI masks, and GitHub silently drops job outputs that
 * contain masked values. The stack name is deterministic, so test jobs
 * resolve the ARN from the stack outputs instead (see the e2e workflow).
 */
const main = async (): Promise<void> => {
  const testStack = buildSharedCapacityProviderStack();
  await testStack.deploy();
  const arn = testStack.findAndGetStackOutputValue('CapacityProviderArn');
  console.log(`LMI_CAPACITY_PROVIDER_ARN=${arn}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
