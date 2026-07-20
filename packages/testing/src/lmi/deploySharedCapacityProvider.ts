import { TEST_ARCHITECTURES } from '../constants.js';
import { buildSharedCapacityProviderStack } from './sharedCapacityProviderStack.js';

/**
 * Deploy the run-scoped shared LMI capacity provider stacks, one per
 * architecture, concurrently: the stacks are independent and EC2-backed, so
 * deploying them sequentially would roughly double the setup time.
 *
 * Intended to run as a workflow setup job step (after the packages have been
 * built):
 * ```yaml
 * - run: node packages/testing/lib/esm/lmi/deploySharedCapacityProvider.js
 * ```
 * The ARNs are deliberately not exposed as job outputs: they contain the AWS
 * account id, which CI masks, and GitHub silently drops job outputs that
 * contain masked values. The stack names are deterministic, so test jobs
 * resolve the ARN from the stack outputs instead (see the e2e workflow).
 */
const main = async (): Promise<void> => {
  await Promise.all(
    (Object.keys(TEST_ARCHITECTURES) as (keyof typeof TEST_ARCHITECTURES)[])
      .map((architecture) => buildSharedCapacityProviderStack(architecture))
      .map(async (testStack) => {
        await testStack.deploy();
        const arn = testStack.findAndGetStackOutputValue('CapacityProviderArn');
        console.log(`${testStack.stack.stackName}: ${arn}`);
      })
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
