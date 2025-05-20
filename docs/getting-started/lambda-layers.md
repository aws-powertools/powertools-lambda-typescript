---
title: Lambda layers
description: Using Powertools for AWS Lambda with Lambda layers
---

<!-- markdownlint-disable MD043 -->

A [Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html){target="_blank"} is a `.zip` file archive that can contain additional code, pre-packaged dependencies, data, or configuration files. We provide a Lambda Layer for Powertools for AWS Lambda (TypeScript) to help you get started quickly with the library.

You can add our layer both in the [AWS Lambda Console _(under `Layers`)_](https://docs.aws.amazon.com/lambda/latest/dg/adding-layers.html){target="_blank"}, or via your favorite infrastructure as code framework with the ARN value. You can use the Lambda Layer both with CommonJS and ESM (ECMAScript modules).

### Layer ARNs

We publish the Lambda Layer for Powertools for AWS Lambda in all commercial regions and AWS GovCloud (US) regions.

???+ tip "Spotted a missing region?"

    Open an [issue](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?template=feature_request.yml&title=Feature%20request%3A%20missing%20Lambda%20layer%20region) in our GitHub repository to request it.

| Region           | Layer ARN                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| `us-east-1`      | [arn:aws:lambda:us-east-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `us-east-2`      | [arn:aws:lambda:us-east-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `us-west-1`      | [arn:aws:lambda:us-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `us-west-2`      | [arn:aws:lambda:us-west-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `ap-south-1`     | [arn:aws:lambda:ap-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}           |
| `ap-south-2`     | [arn:aws:lambda:ap-south-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}           |
| `ap-east-1`      | [arn:aws:lambda:ap-east-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `ap-northeast-1` | [arn:aws:lambda:ap-northeast-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `ap-northeast-2` | [arn:aws:lambda:ap-northeast-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `ap-northeast-3` | [arn:aws:lambda:ap-northeast-3:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `ap-southeast-1` | [arn:aws:lambda:ap-southeast-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `ap-southeast-2` | [arn:aws:lambda:ap-southeast-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `ap-southeast-3` | [arn:aws:lambda:ap-southeast-3:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `ap-southeast-4` | [arn:aws:lambda:ap-southeast-4:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `ap-southeast-5` | [arn:aws:lambda:ap-southeast-5:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `ap-southeast-7` | [arn:aws:lambda:ap-southeast-7:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}       |
| `eu-central-1`   | [arn:aws:lambda:eu-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}         |
| `eu-central-2`   | [arn:aws:lambda:eu-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}         |
| `eu-west-1`      | [arn:aws:lambda:eu-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `eu-west-2`      | [arn:aws:lambda:eu-west-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `eu-west-3`      | [arn:aws:lambda:eu-west-3:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `eu-north-1`     | [arn:aws:lambda:eu-north-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}           |
| `eu-south-1`     | [arn:aws:lambda:eu-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}           |
| `eu-south-2`     | [arn:aws:lambda:eu-south-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}           |
| `ca-central-1`   | [arn:aws:lambda:ca-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}         |
| `ca-west-1`      | [arn:aws:lambda:ca-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `sa-east-1`      | [arn:aws:lambda:sa-east-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}            |
| `af-south-1`     | [arn:aws:lambda:af-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}           |
| `me-south-1`     | [arn:aws:lambda:me-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}           |
| `me-central-1`   | [arn:aws:lambda:me-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}         |
| `il-central-1`   | [arn:aws:lambda:il-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}         |
| `mx-central-1`   | [arn:aws:lambda:mx-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe}         |
| `us-gov-west-1`  | [arn:aws-us-gov:lambda:us-gov-west-1:165093116878:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe} |
| `us-gov-east-1`  | [arn:aws-us-gov:lambda:us-gov-east-1:165087284144:layer:AWSLambdaPowertoolsTypeScriptV2:27](#){: .copyMe} |

### Lookup Layer ARN via AWS SSM Parameter Store

You can also use AWS SSM Parameter Store to dynamically add Powertools for AWS Lambda. The `{version}` placeholder is the semantic version number (e,g. 2.1.0) for a release or `_latest_`.

For example, to get the ARN for version `2.14.0` in the `eu-west-1` region, run the following command:

```bash title="AWS CLI command to get Lambda Layer ARN"
aws ssm get-parameter --name /aws/service/powertools/typescript/generic/all/2.14.0 --region eu-west-1

# output
Parameter:
  ARN: arn:aws:ssm:eu-west-1::parameter/aws/service/powertools/typescript/generic/all/2.14.0
  DataType: text
  LastModifiedDate: '2025-02-11T11:08:45.070000+01:00'
  Name: /aws/service/powertools/typescript/generic/all/2.14.0
  Type: String
  Value: arn:aws:lambda:eu-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27
  Version: 1
```

We currently publish SSM parameters for the following Powertools for AWS Lambda versions in all commercial regions:

- `/aws/service/powertools/typescript/generic/all/latest`: for the latest version of Powertools for AWS Lambda
- `/aws/service/powertools/typescript/generic/all/{version}`: for a specific version of Powertools for AWS Lambda (e.g. `2.14.0`)

See the [examples below](#how-to-use-with-infrastructure-as-code) for how to use the SSM parameter in your infrastructure as code.

### Want to inspect the contents of the Layer?

The pre-signed URL to download this Lambda Layer will be within `Location` key in the CLI output. The CLI output will also contain the Powertools for AWS Lambda version it contains.

Change `{aws::region}` to your AWS region, e.g. `eu-west-1`, and run the following command:

```bash title="AWS CLI command to download Lambda Layer content"
aws lambda get-layer-version-by-arn --arn arn:aws:lambda:{aws::region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27 --region {aws::region}

# output
{  
    "Content": {,
        "Location": "https://awslambda-eu-west-1-layers.s3.eu-west-1.amazonaws.com/...",
        "CodeSha256": "gwGIE8w0JckdDeDCTX6FbWObb2uIDwgiaAq78gMWDyA=",
        "CodeSize": 3548324
    },
    "LayerArn": "arn:aws:lambda:eu-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2",
    "LayerVersionArn": "arn:aws:lambda:eu-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27",
    "Description": "Powertools for AWS Lambda (TypeScript) version 2.18.0",
    "CreatedDate": "2025-04-08T07:38:30.424+0000",
    "Version": 24,
    "CompatibleRuntimes": [
        "nodejs18.x",
        "nodejs20.x",
        "nodejs22.x"
    ],
    "LicenseInfo": "MIT-0",
    "CompatibleArchitectures": [
        "arm64",
        "x86_64"
    ]
}
```

### How to use with Infrastructure as Code

=== "CDK"

    ```typescript hl_lines="14 20"
    import { Stack } from 'aws-cdk-lib';
    import { Construct } from 'constructs';
    import { LayerVersion, Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
    import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
    
    export class SampleFunctionWithLayer extends Construct {
      constructor(scope: Construct, id: string) {
        super(scope, id);
      
        // Create a Layer with Powertools for AWS Lambda (TypeScript)
        const powertoolsLayer = LayerVersion.fromLayerVersionArn(
          this,
          'PowertoolsLayer',
          `arn:aws:lambda:${Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27`
        );
        
        new NodejsFunction(this, 'Function', {
          runtime: Runtime.NODEJS_22_X,
          // Add the Layer to a Lambda function
          layers: [powertoolsLayer],
          code: Code.fromInline(`...`),
          handler: 'index.handler',
        });
      }
    }
    ```

    If you use `esbuild` to bundle your code, make sure to exclude `@aws-lambda-powertools/*` and `@aws-sdk/*` from being bundled since the packages are already present the layer:

    ```typescript
    new NodejsFunction(this, 'Function', {
      ...
      bundling: {
        externalModules: [
          '@aws-lambda-powertools/*',
          '@aws-sdk/*',
        ],
      }
    });
    ```

    Check the AWS CDK `NodeJsFunction` [documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.BundlingOptions.html#externalmodules) for more details.  

    You can also use AWS SSM Parameter Store to dynamically resolve the Layer ARN from SSM Parameter Store and add the toolkit in your code, allowing you to pin to `latest` or a specific Powertools for AWS version.  

    ```typescript hl_lines="5 15-17"
    import { Stack } from 'aws-cdk-lib';
    import { Construct } from 'constructs';
    import { LayerVersion, Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
    import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
    import { StringParameter } from 'aws-cdk-lib/aws-ssm';
    
    export class SampleFunctionWithLayer extends Construct {
      constructor(scope: Construct, id: string) {
        super(scope, id);
      
        // Create a Layer with Powertools for AWS Lambda (TypeScript)
        const powertoolsLayer = LayerVersion.fromLayerVersionArn(
          this,
          'PowertoolsLayer',
          StringParameter.valueForStringParameter(this, 'PowertoolsLayer', {
            parameterName: '/aws/service/powertools/typescript/generic/all/latest',
          })
        );
        
        new NodejsFunction(this, 'Function', {
          runtime: Runtime.NODEJS_22_X,
          // Add the Layer to a Lambda function
          layers: [powertoolsLayer],
          code: Code.fromInline(`...`),
          handler: 'index.handler',
        });
      }
    }
    ```    

=== "SAM"

    ```yaml hl_lines="5"
    MyLambdaFunction:
      Type: AWS::Serverless::Function
        Properties:
          Layers:
            - !Sub arn:aws:lambda:${AWS::Region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27
    ```

    You can also use AWS SSM Parameter Store to dynamically add Powertools for AWS Lambda and resolve the Layer ARN from SSM Parameter Store in your code, allowing you to pin to `latest` or a specific Powertools for AWS Lambda version.

    ```yaml hl_lines="5"
    MyLambdaFunction:
      Type: AWS::Serverless::Function
        Properties:
          Layers:
            - {{resolve:ssm:/aws/service/powertools/typescript/generic/all/latest}}
    ```

    If you use `esbuild` to bundle your code, make sure to exclude `@aws-lambda-powertools/*` and `@aws-sdk/*` from being bundled since the packages are already present the layer:

    ```yaml hl_lines="5-14"
    MyLambdaFunction:
      Type: AWS::Serverless::Function
      Properties:
        ...
        Metadata: 
          # Manage esbuild properties
          BuildMethod: esbuild
          BuildProperties:
          Minify: true
          External:
            - '@aws-lambda-powertools/*'
            - '@aws-sdk/*'
    ```

    Check the [documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build-typescript.html) for more details.

=== "Serverless framework"

    ```yaml hl_lines="5"
    functions:
      hello:
        handler: lambda_function.lambda_handler
        layers:
          - arn:aws:lambda:${aws:region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27
    ```

    If you use `esbuild` to bundle your code, make sure to exclude `@aws-lambda-powertools/*` and `@aws-sdk/*` from being bundled since the packages are already present the layer:

    ```yaml
    custom:
      esbuild:
        external:
          - '@aws-lambda-powertools/*'
          - '@aws-sdk/*'
    ```

    Check the [documentation](https://floydspace.github.io/serverless-esbuild/) for more details.

=== "Terraform"

    ```terraform hl_lines="18"
    terraform {
      required_version = "~> 1.0.5"
      required_providers {
        aws = "~> 3.50.0"
      }
    }

    provider "aws" {
      region  = "{aws::region}"
    }

    resource "aws_lambda_function" "test_lambda" {
      filename      = "lambda_function_payload.zip"
      function_name = "lambda_function_name"
      role          = ...
      handler       = "index.handler"
      runtime 		= "nodejs22.x"
      layers 		= ["arn:aws:lambda:{aws::region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27"]
      source_code_hash = filebase64sha256("lambda_function_payload.zip")
    }
    ```

    You can use [data sources](https://developer.hashicorp.com/terraform/language/data-sources) to resolve the SSM Parameter Store in your code, allowing you to pin to `latest` or a specific Powertools for AWS Lambda version.

    ```terraform
      data "aws_ssm_parameter" "powertools_version" {
        # Replace {version} with your chosen Powertools for AWS Lambda version or latest
        name = "/aws/service/powertools/python/generic/all/latest"
      }

      resource "aws_lambda_function" "test_lambda" {
        ...

        runtime = "nodejs22.x"

        layers = [data.aws_ssm_parameter.powertools_version.value]
      }
    ```

=== "Pulumi"

    ```typescript hl_lines="11"
    import * as pulumi from '@pulumi/pulumi';
    import * as aws from '@pulumi/aws';

    const role = new aws.iam.Role('role', {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal(aws.iam.Principals.LambdaPrincipal),
        managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole]
    });

    const lambdaFunction = new aws.lambda.Function('function', {
        layers: [
            pulumi.interpolate`arn:aws:lambda:${aws.getRegionOutput().name}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27`
        ],
        code: new pulumi.asset.FileArchive('lambda_function_payload.zip'),
        tracingConfig: {
            mode: 'Active'
        },
        runtime: aws.lambda.Runtime.NodeJS22dX,
        handler: 'index.handler',
        role: role.arn,
        architectures: ['x86_64']
    });
    ```

=== "Amplify"

    Remember to replace the region with your AWS region, e.g., `eu-west-1`. Amplify Gen 2 currently does not support obtaining the region dynamically.

    ```typescript hl_lines="9 19"
    import { defineFunction } from "@aws-amplify/backend";

    export const myFunction = defineFunction({
      name: "my-function",
      layers: {
        "@aws-lambda-powertools/*":
          "arn:aws:lambda:${AWS::Region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:27",
      },
    });
    ```
