import { LayerVersion, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Md5 } from 'ts-md5';

export interface PowertoolsTypeScriptLayerProps {
  /**
   * The powertools package version from npm repository.
   */
  readonly version?: string

  /**
   * the name of the layer, will be randomised by cdk if empty
   */
  readonly layerVersionName?: string
}

export class PowertoolsTypeScriptLayer extends LayerVersion {
  public constructor(scope: Construct, id: string, props?: PowertoolsTypeScriptLayerProps) {
    const version = props?.version ?? 'latest';
    console.log(`publishing layer ${props?.layerVersionName} version : ${version}`);

    super(scope, id, {
      layerVersionName: props?.layerVersionName,
      description: `AWS Lambda Powertools for TypeScript version ${props?.version}`,
      compatibleRuntimes: [
        Runtime.NODEJS_14_X,
        Runtime.NODEJS_16_X,
        Runtime.NODEJS_18_X
      ],
      code: Code.fromAsset('../tmp', {
        assetHash: Md5.hashStr(version),
        bundling: {
          image: Runtime.NODEJS_14_X.bundlingImage,
        },
      }),
    });
  }
}
