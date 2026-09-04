import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  cpSync,
  globSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import {
  Architecture,
  CfnLayerVersionPermission,
  Code,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INSTALL_MAX_ATTEMPTS = 5;
const INSTALL_BASE_DELAY_MS = 5_000;

/**
 * Synchronous sleep for CDK's `tryBundle`, which is called synchronously and
 * cannot await. Parks the thread on a never-notified `Atomics.wait` lock, so it
 * blocks without spinning the CPU or spawning a `sleep` subprocess.
 */
const sleepSync = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

/**
 * Runs `execFileSync`, retrying with exponential backoff so the layer install
 * can ride out npm registry propagation lag for freshly published versions (#5564).
 */
const execFileWithRetry = (
  file: string,
  args: string[],
  maxAttempts: number = INSTALL_MAX_ATTEMPTS
): void => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execFileSync(file, args);
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(
          `Command failed after ${maxAttempts} attempts: ${file} ${args.join(' ')}`
        );
        throw error;
      }
      const delayMs = INSTALL_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `Command failed (attempt ${attempt}/${maxAttempts}), retrying in ${
          delayMs / 1000
        }s`
      );
      sleepSync(delayMs);
    }
  }
};

interface LayerUtility {
  /** Workspace directory under `packages/`, used with `npm -w packages/<dir>`. */
  readonly workspace: string;
  /** Published npm package name, e.g. `@aws-lambda-powertools/logger`. */
  readonly packageName: string;
}

/**
 * Discovers the packages to bundle in the layer by scanning the `packages/`
 * workspace and keeping every non-private `@aws-lambda-powertools/*` package.
 *
 * Deriving the list means a newly added utility is bundled automatically and
 * the list cannot silently drift out of sync with the workspace (#5576).
 */
export const getLayerUtilities = (packagesDir: string): LayerUtility[] =>
  readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      let manifest: { name?: string; private?: boolean };
      try {
        manifest = JSON.parse(
          readFileSync(join(packagesDir, entry.name, 'package.json'), 'utf-8')
        );
      } catch {
        return [];
      }
      if (
        manifest.private === true ||
        typeof manifest.name !== 'string' ||
        !manifest.name.startsWith('@aws-lambda-powertools/')
      ) {
        return [];
      }
      return [{ workspace: entry.name, packageName: manifest.name }];
    })
    .sort((a, b) => a.workspace.localeCompare(b.workspace));

/**
 * Prefix of the tarball produced by `npm pack` for a scoped package, e.g.
 * `@aws-lambda-powertools/logger` -> `aws-lambda-powertools-logger-`.
 */
export const packTarballPrefix = (packageName: string): string =>
  `${packageName.replace(/^@/, '').replace(/\//g, '-')}-`;

export interface LayerPublisherStackProps extends StackProps {
  readonly layerName?: string;
  readonly powertoolsPackageVersion?: string;
  readonly ssmParameterLayerArn: string;
  readonly buildFromLocal?: boolean;
}

export class LayerPublisherStack extends Stack {
  public readonly lambdaLayerVersion: LayerVersion;
  public constructor(
    scope: Construct,
    id: string,
    props: LayerPublisherStackProps
  ) {
    super(scope, id, props);

    const { layerName, powertoolsPackageVersion, buildFromLocal } = props;

    console.log(
      `publishing layer ${layerName} version : ${powertoolsPackageVersion}`
    );

    this.lambdaLayerVersion = new LayerVersion(this, 'LambdaPowertoolsLayer', {
      layerVersionName: props?.layerName,
      description: `Powertools for AWS Lambda (TypeScript) version ${powertoolsPackageVersion}`,
      compatibleRuntimes: [Runtime.NODEJS_22_X, Runtime.NODEJS_24_X],
      license: 'MIT-0',
      compatibleArchitectures: [Architecture.ARM_64, Architecture.X86_64],
      code: Code.fromAsset(resolve(__dirname), {
        bundling: {
          // This is here only because is required by CDK, however it is not used since the bundling is done locally
          image: Runtime.NODEJS_24_X.bundlingImage,
          // We need to run a command to generate a random UUID to force the bundling to run every time
          command: [`echo "${randomUUID()}"`],
          local: {
            tryBundle(outputDir: string) {
              // This folder are relative to the layers folder
              const tmpBuildPath = resolve(__dirname, '..', 'tmp');
              const tmpBuildDir = join(tmpBuildPath, 'nodejs');
              // This folder is the project root, relative to the current file
              const projectRoot = resolve(__dirname, '..', '..');

              // The packages to bundle in the Lambda Layer are derived from the
              // workspace: every non-private @aws-lambda-powertools/* package
              // under packages/. New utilities are bundled automatically.
              const utilities = getLayerUtilities(
                join(projectRoot, 'packages')
              );
              if (utilities.length === 0) {
                throw new Error(
                  `No publishable utilities found under ${join(projectRoot, 'packages')}`
                );
              }

              // These files are relative to the tmp folder
              const filesToRemove = [
                'node_modules/@types',
                'package.json',
                'package-lock.json',
                'node_modules/**/*.md',
                'node_modules/.bin',
                'node_modules/**/*.html',
                'node_modules/**/.travis.yml',
                'node_modules/**/.eslintrc',
                'node_modules/**/.npmignore',
                'node_modules/semver/bin',
                'node_modules/emitter-listener/test',
                'node_modules/fast-xml-parser/cli',
                'node_modules/async-hook-jl/test',
                'node_modules/stack-chain/test',
                'node_modules/shimmer/test',
                'node_modules/obliterator/*.d.ts',
                'node_modules/strnum/.vscode',
                'node_modules/strnum/*.test.js',
                'node_modules/uuid/bin',
                'node_modules/uuid/esm-browser',
                'node_modules/uuid/esm-node',
                'node_modules/uuid/umd',
                'node_modules/mnemonist/*.d.ts',
                // We remove the type definitions and ES builds since they are not used in the Lambda Layer
                'node_modules/@aws-lambda-powertools/*/lib/**/*.d.ts',
                'node_modules/@aws-lambda-powertools/*/lib/**/*.d.ts.map',
                'node_modules/@aws-sdk/*/dist-types',
                'node_modules/@smithy/*/dist-types',
                'node_modules/@smithy/**/README.md',
                'node_modules/@aws-sdk/**/README.md',
              ];
              // We deliberately do NOT ship any @aws-sdk/* client in the layer.
              //
              // The layer is mounted at /opt/nodejs/node_modules, which precedes
              // /var/runtime/node_modules on NODE_PATH. Any SDK package we ship
              // therefore shadows the runtime's copy for customer code too. Since
              // we only ever shipped a subset (e.g. client-dynamodb but never
              // lib-dynamodb), customers using the DocumentClient ended up with a
              // layer-provided client and a runtime-provided lib, and any breaking
              // change across that boundary surfaces as a runtime error.
              //
              // The Node.js runtime already provides a complete, self-consistent
              // AWS SDK v3, so we rely on it instead of exposing a partial one.
              const modulesToInstall: string[] = ['zod'];

              if (!buildFromLocal) {
                // Dependencies to install in the Lambda Layer
                modulesToInstall.push(
                  ...utilities.map(
                    (util) => `${util.packageName}@${powertoolsPackageVersion}`
                  )
                );
              }

              // Phase 1: Cleanup & create tmp folder
              rmSync(tmpBuildDir, { recursive: true, force: true });
              mkdirSync(tmpBuildDir, { recursive: true });

              // Phase 2: (Optional) Build packages & pack them
              if (buildFromLocal) {
                for (const util of utilities) {
                  execFileSync(
                    'npm',
                    ['run', 'build', '-w', `packages/${util.workspace}`],
                    { cwd: projectRoot }
                  );
                  const packOutput = execFileSync(
                    'npm',
                    ['pack', '-w', `packages/${util.workspace}`, '--json'],
                    { cwd: projectRoot, encoding: 'utf-8' }
                  );
                  const packedTarballs = JSON.parse(packOutput) as Array<{
                    filename?: string;
                  }>;
                  const tarball = packedTarballs[0]?.filename;
                  if (packedTarballs.length !== 1 || tarball === undefined) {
                    throw new Error(
                      `Could not determine packed tarball for ${util.packageName}`
                    );
                  }
                  const tmpTarballPath = join(tmpBuildDir, tarball);
                  renameSync(join(projectRoot, tarball), tmpTarballPath);
                  modulesToInstall.push(tmpTarballPath);
                  filesToRemove.push(tarball);
                }
              }

              // Phase 3: Install dependencies to tmp folder. Retry with backoff
              // to absorb npm registry propagation delays for freshly published
              // versions (see issue #5564).
              execFileWithRetry('npm', [
                'i',
                '--prefix',
                tmpBuildDir,
                ...modulesToInstall,
              ]);

              // Phase 4: Remove unnecessary files
              for (const pattern of filesToRemove) {
                for (const filePath of globSync(pattern, {
                  cwd: tmpBuildDir,
                })) {
                  rmSync(join(tmpBuildDir, filePath), {
                    recursive: true,
                    force: true,
                  });
                }
              }

              // Phase 5: patch require keyword in ESM Tracer package due to AWS X-Ray SDK for Node.js not being ESM compatible
              const esmTracerPath = join(
                tmpBuildDir,
                'node_modules',
                '@aws-lambda-powertools/tracer',
                'lib',
                'esm',
                'provider',
                'ProviderService.js'
              );
              writeFileSync(
                esmTracerPath,
                `import { createRequire } from 'module'; const require = createRequire(import.meta.url);${readFileSync(esmTracerPath, 'utf-8')}`
              );

              // Phase 6: Copy files from tmp folder to cdk.out asset folder (the folder is created by CDK)
              cpSync(tmpBuildPath, outputDir, { recursive: true });

              // Phase 7: (Optional) Restore changes to the project root made by the build
              if (buildFromLocal) {
                execFileSync(
                  'git',
                  [
                    'restore',
                    '--',
                    ...utilities.map((util) =>
                      join('packages', util.workspace, 'package.json')
                    ),
                  ],
                  {
                    cwd: projectRoot,
                  }
                );
              }

              return true;
            },
          },
        },
      }),
    });

    const layerPermission = new CfnLayerVersionPermission(
      this,
      'PublicLayerAccess',
      {
        action: 'lambda:GetLayerVersion',
        layerVersionArn: this.lambdaLayerVersion.layerVersionArn,
        principal: '*',
      }
    );

    layerPermission.applyRemovalPolicy(RemovalPolicy.RETAIN);
    this.lambdaLayerVersion.applyRemovalPolicy(RemovalPolicy.RETAIN);

    new StringParameter(this, 'VersionArn', {
      parameterName: props.ssmParameterLayerArn,
      stringValue: this.lambdaLayerVersion.layerVersionArn,
    });

    new CfnOutput(this, 'LatestLayerArn', {
      value: this.lambdaLayerVersion.layerVersionArn,
      exportName: props?.layerName ?? 'LambdaPowerToolsForTypeScriptLayerARN',
    });
  }
}
