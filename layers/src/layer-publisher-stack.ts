import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  CfnLayerVersionPermission,
  Code,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join, resolve, sep } from 'node:path';

export interface LayerPublisherStackProps extends StackProps {
  readonly layerName?: string;
  readonly powertoolsPackageVersion?: string;
  readonly ssmParameterLayerArn: string;
}

export class LayerPublisherStack extends Stack {
  public readonly lambdaLayerVersion: LayerVersion;
  public constructor(
    scope: Construct,
    id: string,
    props: LayerPublisherStackProps
  ) {
    super(scope, id, props);

    const { layerName, powertoolsPackageVersion } = props;

    console.log(
      `publishing layer ${layerName} version : ${powertoolsPackageVersion}`
    );

    this.lambdaLayerVersion = new LayerVersion(this, 'LambdaPowertoolsLayer', {
      layerVersionName: props?.layerName,
      description: `Powertools for AWS Lambda (TypeScript) version ${powertoolsPackageVersion}`,
      compatibleRuntimes: [
        Runtime.NODEJS_14_X,
        Runtime.NODEJS_16_X,
        Runtime.NODEJS_18_X,
      ],
      license: 'MIT-0',
      // This is needed because the following regions do not support the compatibleArchitectures property #1400
      // ...(![ 'eu-south-2', 'eu-central-2', 'ap-southeast-4' ].includes(Stack.of(this).region) ? { compatibleArchitectures: [Architecture.X86_64] } : {}),
      code: Code.fromAsset(resolve(__dirname), {
        bundling: {
          image: Runtime.NODEJS_18_X.bundlingImage,
          // We need to run a command to generate a random UUID to force the bundling to run every time
          command: [`echo "${randomUUID()}"`],
          local: {
            tryBundle(outputDir: string) {
              try {
                execSync('npm --version');
              } catch {
                return false;
              }

              console.log('Bundling dependencies...');

              // This folder are relative to the layers folder
              const tmpBuildPath = join(resolve(__dirname, 'tmp'), 'nodejs');
              const tmpBuildDir = join(tmpBuildPath, 'nodejs');
              // Dependencies to install in the Lambda Layer
              const modulesToInstall = [
                `@aws-lambda-powertools/logger@${powertoolsPackageVersion}`,
                `@aws-lambda-powertools/metrics@${powertoolsPackageVersion}`,
                `@aws-lambda-powertools/tracer@${powertoolsPackageVersion}`,
              ];
              // These files are relative to the tmp folder
              const filesToRemove = [
                'node_modules/@types',
                'package.json',
                'package-lock.json',
              ];

              const commands = [
                // Clean up existing tmp folder from previous builds
                `rm -rf ${tmpBuildDir}`,
                // Create tmp folder again
                `mkdir -p ${tmpBuildDir}`,
                // Install dependencies to tmp folder
                `npm i --prefix ${tmpBuildDir} ${modulesToInstall.join(' ')}`,
                // Remove unnecessary files
                `rm -rf ${filesToRemove
                  .map((filePath) => `${tmpBuildDir}/${filePath}`)
                  .join(' ')}`,
                // Copy files from tmp folder to cdk.out asset folder (the folder is created by CDK)
                `cp -R ${tmpBuildPath}${sep}* ${outputDir}`,
              ];

              // Actually run the commands
              execSync(commands.join(' && '));

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
      exportName: props?.layerName ?? `LambdaPowerToolsForTypeScriptLayerARN`,
    });
  }
}
