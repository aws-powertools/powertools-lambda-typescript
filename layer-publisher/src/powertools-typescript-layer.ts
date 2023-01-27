import * as path from 'path';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { execSync } from 'child_process';
import { Md5 } from 'ts-md5';

export interface PowerToolsTypeScriptLayerProps {
  /**
   * The powertools package version from npm repository.
   */
  readonly version?: string

  /**
   * the name of the layer, will be randomised by cdk if empty
   */
  readonly layerVersionName?: string
}

export class PowerToolsTypeScriptLayer extends lambda.LayerVersion {
  public constructor(scope: Construct, id: string, props?: PowerToolsTypeScriptLayerProps) {
    const version = props?.version ?? 'latest';
    console.log(`publishing layer ${props?.layerVersionName} version : ${version}`);

    const commands = [
      'mkdir nodejs',
      'cd nodejs',
      'npm init -y',
      `npm install --save \
        @aws-lambda-powertools/commons@${version} \
        @aws-lambda-powertools/logger@${version} \
        @aws-lambda-powertools/metrics@${version} \
        @aws-lambda-powertools/tracer@${version}`,
      'rm -rf node_modules/@types',
      'rm package.json package-lock.json',
    ];
    const commandJoined = commands.join(' && ');

    super(scope, id, {
      layerVersionName: props?.layerVersionName,
      description: `Lambda Powertools for TypeScript version ${props?.version}`,
      compatibleRuntimes: [ lambda.Runtime.NODEJS_14_X, lambda.Runtime.NODEJS_16_X, lambda.Runtime.NODEJS_18_X ],
      code: lambda.Code.fromAsset(path.join(__dirname, '.'), {
        assetHash: Md5.hashStr(commandJoined),
        bundling: {
          image: lambda.Runtime.NODEJS_14_X.bundlingImage,
          local: {
            tryBundle(outputDir: string) {
              try {
                execSync('npm --version && zip --version');
              } catch {
                return false;
              }

              execSync(commandJoined, { cwd: outputDir });

              return true;
            },
          },
        },
      }),
    });
  }
}
