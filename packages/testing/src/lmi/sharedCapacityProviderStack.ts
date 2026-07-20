import { App, CfnOutput, Stack } from 'aws-cdk-lib';
import { getArchitectureKey } from '../helpers.js';
import { TestLmiCapacityProvider } from '../resources/TestLmiCapacityProvider.js';
import { TestStack } from '../TestStack.js';

/**
 * Build the run-scoped shared Lambda Managed Instances (LMI) capacity
 * provider stack.
 *
 * EC2-backed capacity providers and their networking are the slowest
 * resources in the LMI e2e suites, so instead of every suite provisioning its
 * own, a workflow run deploys ONE shared stack per architecture up front (see
 * `deploySharedCapacityProvider.ts`) and passes the capacity provider ARN to
 * the test cells via the `LMI_CAPACITY_PROVIDER_ARN` environment variable.
 * The capacity provider is architecture-constrained but package- and
 * runtime-agnostic: all packages' LMI suites, on both Node.js versions,
 * attach their functions to the same per-architecture capacity provider.
 *
 * The stack name is scoped to the workflow run (`LmiShared-<runId>-<arch>`)
 * so concurrent runs never share state and a run's teardown can never race
 * another run. The name must be deterministic — the teardown job reconstructs
 * it in a fresh process — so it deliberately does not use
 * `generateTestUniqueName()`, which embeds a random component.
 */
const buildSharedCapacityProviderStack = (): TestStack => {
  const runId = process.env.GITHUB_RUN_ID ?? 'local';
  if (!/^[A-Za-z0-9-]+$/.test(runId)) {
    throw new Error(
      `Invalid run id "${runId}": only alphanumerics and hyphens are allowed`
    );
  }
  const stackName = `LmiShared-${runId}-${getArchitectureKey().replace('_', '-')}`;

  const app = new App();
  const stack = new Stack(app, stackName, {
    tags: {
      Service: 'Powertools-for-AWS-e2e-tests',
    },
  });
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: 'LmiShared',
      testName: 'sharedCapacityProvider',
    },
    app,
    stack,
  });
  const capacityProvider = new TestLmiCapacityProvider(testStack);
  new CfnOutput(stack, 'CapacityProviderArn', {
    value: capacityProvider.capacityProviderArn,
  });

  return testStack;
};

export { buildSharedCapacityProviderStack };
