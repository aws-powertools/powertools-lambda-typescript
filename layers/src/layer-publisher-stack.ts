import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join, resolve, sep } from 'node:path';
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
      compatibleRuntimes: [
        Runtime.NODEJS_18_X,
        Runtime.NODEJS_20_X,
        Runtime.NODEJS_22_X,
      ],
      license: 'MIT-0',
      compatibleArchitectures: [Architecture.ARM_64, Architecture.X86_64],
      code: Code.fromAsset(resolve(__dirname), {
        bundling: {
          // This is here only because is required by CDK, however it is not used since the bundling is done locally
          image: Runtime.NODEJS_22_X.bundlingImage,
          // We need to run a command to generate a random UUID to force the bundling to run every time
          command: [`echo "${randomUUID()}"`],
          local: {
            tryBundle(outputDir: string) {
              // This folder are relative to the layers folder
              const tmpBuildPath = resolve(__dirname, '..', 'tmp');
              const tmpBuildDir = join(tmpBuildPath, 'nodejs');
              // This folder is the project root, relative to the current file
              const projectRoot = resolve(__dirname, '..', '..');

              // This is the list of packages that we need include in the Lambda Layer
              // the name is the same as the npm workspace name
              const utilities = [
                'commons',
                'jmespath',
                'logger',
                'metrics',
                'tracer',
                'parameters',
                'idempotency',
                'batch',
                'parser',
              ];

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
                'node_modules/@smithy/**/README.md ',
                'node_modules/@aws-sdk/**/README.md ',
              ];
              const buildCommands: string[] = [];
              // We install these to get the latest version of the packages
              const modulesToInstall: string[] = [
                '@aws-sdk/client-dynamodb',
                '@aws-sdk/util-dynamodb',
                '@aws-sdk/client-ssm',
                '@aws-sdk/client-secrets-manager',
                '@aws-sdk/client-appconfigdata',
                'zod',
              ];

              if (buildFromLocal) {
                for (const util of utilities) {
                  // Build latest version of the package
                  buildCommands.push(`npm run build -w packages/${util}`);
                  // Pack the package to a .tgz file
                  buildCommands.push(`npm pack -w packages/${util}`);
                  // Move the .tgz file to the tmp folder
                  buildCommands.push(
                    `mv aws-lambda-powertools-${util}-*.tgz ${tmpBuildDir}`
                  );
                }
                modulesToInstall.push(
                  ...utilities.map((util) =>
                    join(tmpBuildDir, `aws-lambda-powertools-${util}-*.tgz`)
                  )
                );
                filesToRemove.push(
                  ...utilities.map((util) =>
                    join(`aws-lambda-powertools-${util}-*.tgz`)
                  )
                );
              } else {
                // Dependencies to install in the Lambda Layer
                modulesToInstall.push(
                  ...utilities.map(
                    (util) =>
                      `@aws-lambda-powertools/${util}@${powertoolsPackageVersion}`
                  )
                );
              }

              // Phase 1: Cleanup & create tmp folder
              execSync(
                [
                  // Clean up existing tmp folder from previous builds
                  `rm -rf ${tmpBuildDir}`,
                  // Create tmp folder again
                  `mkdir -p ${tmpBuildDir}`,
                ].join(' && ')
              );

              // Phase 2: (Optional) Build packages & pack them
              buildFromLocal &&
                execSync(buildCommands.join(' && '), { cwd: projectRoot });

              // Phase 3: Install dependencies to tmp folder
              execSync(
                `npm i --prefix ${tmpBuildDir} ${modulesToInstall.join(' ')}`
              );

              // Phase 4: Remove unnecessary files
              execSync(
                `rm -rf ${filesToRemove
                  .map((filePath) => `${tmpBuildDir}/${filePath}`)
                  .join(' ')}`
              );

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
              execSync(
                `echo "import { createRequire } from 'module'; const require = createRequire(import.meta.url);$(cat ${esmTracerPath})" > ${esmTracerPath}`
              );

              // Phase 6: Copy files from tmp folder to cdk.out asset folder (the folder is created by CDK)
              execSync(`cp -R ${tmpBuildPath}${sep}* ${outputDir}`);

              // Phase 7: (Optional) Restore changes to the project root made by the build
              buildFromLocal &&
                execSync('git restore packages/*/package.json', {
                  cwd: projectRoot,
                });

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
