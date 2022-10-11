import * as path from 'path';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { execSync } from 'child_process';

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
    super(scope, id, {
      layerVersionName: props?.layerVersionName,
      compatibleRuntimes: [ lambda.Runtime.NODEJS_12_X, lambda.Runtime.NODEJS_14_X, lambda.Runtime.NODEJS_16_X ],
      code: lambda.Code.fromAsset(path.join(__dirname, '.'), {
        bundling: {
          image: lambda.Runtime.NODEJS_12_X.bundlingImage,
          local: {
            tryBundle(outputDir: string) {
              try {
                execSync('npm --version && zip --version');
              } catch {
                return false;
              }

              const commands = [
                'mkdir nodejs && cd nodejs',
                'npm init -y',
                `npm install @aws-lambda-powertools/commons@${
                  props?.version ?? 'latest'
                } @aws-lambda-powertools/logger@${props?.version ?? 'latest'} @aws-lambda-powertools/metrics@${
                  props?.version ?? 'latest'
                } @aws-lambda-powertools/tracer@${props?.version ?? 'latest'}`,
                'rm package.json package-lock.json',
                'cd ..',
                `cp -a nodejs ${outputDir}`,
                `rm -rf nodejs`,
              ];

              execSync(commands.join(' && '));

              return true;
            },
          },
        },
      }),
    });
  }
}
