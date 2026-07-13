import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import {
  type ICloudAssemblySource,
  StackSelectionStrategy,
  Toolkit,
} from '@aws-cdk/toolkit-lib';
import { App, CfnOutput, Stack } from 'aws-cdk-lib';
import { getArchitectureKey } from '../helpers.js';
import { TestLmiCapacityProvider } from '../resources/TestLmiCapacityProvider.js';

/**
 * CLI to manage the run-scoped shared Lambda Managed Instances (LMI)
 * capacity provider stacks.
 *
 * EC2-backed capacity providers and their networking are the slowest
 * resources in the LMI e2e suites, so instead of every suite provisioning
 * its own, a workflow run deploys ONE shared stack per architecture up
 * front and passes the capacity provider ARN to the test cells via the
 * `LMI_CAPACITY_PROVIDER_ARN` environment variable. The capacity provider
 * is architecture-constrained but package- and runtime-agnostic: all
 * packages' LMI suites, on both Node.js versions, attach their functions
 * to the same per-architecture capacity provider.
 *
 * The stack name is scoped to the workflow run (`LmiShared-<runId>-<arch>`)
 * so concurrent runs never share state and a run's teardown can never race
 * another run.
 *
 * Usage:
 * ```
 * ARCH=x86_64 node lib/esm/lmi/cli.js deploy --run-id 12345
 * ARCH=x86_64 node lib/esm/lmi/cli.js destroy --run-id 12345
 * ```
 * The deploy command prints `LMI_CAPACITY_PROVIDER_ARN=<arn>` on stdout as
 * its last line so callers (e.g. a GitHub Actions setup job) can capture it.
 */

/**
 * A run id becomes part of a CloudFormation stack name and a temp directory
 * path, so it is restricted to the characters CloudFormation already allows in
 * a stack name (alphanumerics and hyphens). This also prevents a crafted
 * `--run-id` (e.g. containing `../`) from escaping `tmpdir()` when it is joined
 * into the assembly output path.
 */
const assertValidRunId = (runId: string): string => {
  if (!/^[A-Za-z0-9-]+$/.test(runId)) {
    throw new Error(
      `Invalid --run-id "${runId}": only alphanumerics and hyphens are allowed`
    );
  }
  return runId;
};

const buildStackName = (runId: string): string =>
  `LmiShared-${assertValidRunId(runId)}-${getArchitectureKey().replace('_', '-')}`;

const buildApp = (stackName: string): { app: App; stack: Stack } => {
  const app = new App();
  const stack = new Stack(app, stackName, {
    tags: {
      Service: 'Powertools-for-AWS-e2e-tests',
    },
  });
  const capacityProvider = new TestLmiCapacityProvider({ stack });
  new CfnOutput(stack, 'CapacityProviderArn', {
    value: capacityProvider.capacityProviderArn,
  });

  return { app, stack };
};

const makeAssembly = async (
  cli: Toolkit,
  app: App,
  stackName: string
): Promise<{ cx: ICloudAssemblySource; outputFilePath: string }> => {
  const base = tmpdir();
  const outdir = resolve(base, `${stackName}-powertools-e2e-testing`);
  // Defence in depth: the constructed output directory must stay within the
  // system temp directory. Combined with run-id validation this guarantees the
  // paths we write to and read back cannot be steered outside tmpdir().
  if (outdir !== base && !outdir.startsWith(base + sep)) {
    throw new Error(`Refusing to use output directory outside ${base}`);
  }
  const outputFilePath = join(outdir, 'outputs.json');
  const cx = await cli.fromAssemblyBuilder(async () => app.synth(), {
    outdir,
  });
  return { cx, outputFilePath };
};

const main = async (): Promise<void> => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      'run-id': {
        type: 'string',
        default: process.env.GITHUB_RUN_ID ?? 'local',
      },
    },
  });
  const action = positionals[0];
  if (action !== 'deploy' && action !== 'destroy') {
    throw new Error('Usage: cli.js <deploy|destroy> [--run-id <id>]');
  }

  const stackName = buildStackName(values['run-id']);
  const { app } = buildApp(stackName);
  const cli = new Toolkit({ color: false });
  const { cx, outputFilePath } = await makeAssembly(cli, app, stackName);

  if (action === 'deploy') {
    await cli.deploy(cx, {
      stacks: { strategy: StackSelectionStrategy.ALL_STACKS },
      outputsFile: outputFilePath,
    });
    const outputs = JSON.parse(await readFile(outputFilePath, 'utf-8'))[
      stackName
    ];
    console.log(`LMI_CAPACITY_PROVIDER_ARN=${outputs.CapacityProviderArn}`);
    return;
  }

  await cli.destroy(cx, {
    stacks: { strategy: StackSelectionStrategy.ALL_STACKS },
  });
  console.log(`Destroyed ${stackName}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
