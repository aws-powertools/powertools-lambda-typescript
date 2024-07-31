---
title: Homepage
description: Powertools for AWS Lambda (TypeScript)
---

<!-- markdownlint-disable MD043 MD013 -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless best practices and increase developer velocity.

You can use Powertools for AWS Lambda in both TypeScript and JavaScript code bases.

<!-- markdownlint-disable MD050 -->
<div class="grid cards" markdown>

- :material-battery-charging:{ .lg .middle } __Features__

    ---

    Adopt one, a few, or all industry practices. **Progressively**.

    [:octicons-arrow-right-24: All features](#features)

- :heart:{ .lg .middle } __Support this project__

    ---

    Become a public reference customer, share your work, contribute, use Lambda Layers, etc.

    [:octicons-arrow-right-24: Support](#support-powertools-for-aws-lambda-typescript)

- :material-file-code:{ .lg .middle } __Available languages__

    ---

    Powertools for AWS Lambda is also available in other languages

    :octicons-arrow-right-24: [Python](https://docs.powertools.aws.dev/lambda/python/latest/){target="_blank" }, [Java](https://docs.powertools.aws.dev/lambda/java/){target="_blank"}, and [.NET](https://docs.powertools.aws.dev/lambda/dotnet/){target="_blank"}

</div>

## Install

You can use Powertools for AWS Lambda (TypeScript) by installing it with your favorite dependency management, or via Lambda Layers:

=== "npmjs.com"

    All features are available as individual packages, so you can install only the ones you need, for example:

    * **Logger**: `npm i @aws-lambda-powertools/logger`{.copyMe}:clipboard:
    * **Metrics**: `npm i @aws-lambda-powertools/metrics`{.copyMe}:clipboard:
    * **Tracer**: `npm i @aws-lambda-powertools/tracer`{.copyMe}:clipboard:

    ### Extra dependencies

    Some features use additional dependencies like the AWS SDK for JavaScript v3, which might you need to install separately if you are using any of the features below:

    | Feature                                                               | Install                                                                                                           | Default dependency  |
    | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------- |
    | **[Tracer](./core/tracer.md#install)**                                | **`npm i @aws-lambda-powertools/tracer`**{.copyMe}:clipboard:                                                     | `aws-xray-sdk-core` |
    | **[Idempotency](./utilities/idempotency.md#install)**                 | **`npm i @aws-lambda-powertools/idempotency @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb`**{.copyMe}:clipboard: | `jmespath`          |
    | **[Parameters (SSM)](./utilities/parameters.md#install)**             | **`npm i @aws-lambda-powertools/parameters @aws-sdk/client-ssm`**{.copyMe}:clipboard:                             |                     |
    | **[Parameters (Secrets Manager)](./utilities/parameters.md#install)** | **`npm i @aws-lambda-powertools/parameters @aws-sdk/client-secrets-manager`**{.copyMe}:clipboard:                 |                     |
    | **[Parameters (AppConfig)](./utilities/parameters.md#install)**       | **`npm i @aws-lambda-powertools/parameters @aws-sdk/client-appconfigdata`**{.copyMe}:clipboard:                   |                     |
    | **[Parser](./utilities/parser.md#install)**                           | **`npm i @aws-lambda-powertools/parser zod@~3`**{.copyMe}:clipboard:                                              |                     |

=== "Lambda Layer"

    You can add our layer both in the [AWS Lambda Console _(under `Layers`)_](https://eu-west-1.console.aws.amazon.com/lambda/home#/add/layer){target="_blank"}, or via your favorite infrastructure as code framework with the ARN value.

    For the latter, make sure to replace `{region}` with your AWS region, e.g., `eu-west-1`.

    __arn:aws:lambda:{region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11__{: .copyMe}:clipboard:

    ???+ note "Code snippets for popular infrastructure as code frameworks"

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
                  `arn:aws:lambda:${Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11`
                );
                
                new Function(this, 'Function', {
                  runtime: Runtime.NODEJS_20_X,
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

            Check the [documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.BundlingOptions.html#externalmodules) for more details.

        === "SAM"

            ```yaml hl_lines="5"
            MyLambdaFunction:
              Type: AWS::Serverless::Function
                Properties:
                  Layers:
                    - !Sub arn:aws:lambda:${AWS::Region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11
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
                  - arn:aws:lambda:${aws:region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11
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
              runtime 		= "nodejs20.x"
              layers 		= ["arn:aws:lambda:{aws::region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11"]
              source_code_hash = filebase64sha256("lambda_function_payload.zip")
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
                    pulumi.interpolate`arn:aws:lambda:${aws.getRegionOutput().name}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11`
                ],
                code: new pulumi.asset.FileArchive('lambda_function_payload.zip'),
                tracingConfig: {
                    mode: 'Active'
                },
                runtime: aws.lambda.Runtime.NodeJS20dX,
                handler: 'index.handler',
                role: role.arn,
                architectures: ['x86_64']
            });
            ```

        === "Amplify"

            ```zsh hl_lines="9 19"
            # Create a new one with the layer
            ❯ amplify add function
            ? Select which capability you want to add: Lambda function (serverless function)
            ? Provide an AWS Lambda function name: <NAME-OF-FUNCTION>
            ? Choose the runtime that you want to use: NodeJS
            ? Do you want to configure advanced settings? Yes
            ...
            ? Do you want to enable Lambda layers for this function? Yes
            ? Enter up to 5 existing Lambda layer ARNs (comma-separated): arn:aws:lambda:{aws::region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11
            ❯ amplify push -y
            
            # Updating an existing function and add the layer
            ❯ amplify update function
            ? Select the Lambda function you want to update test2
            General information
            - Name: <NAME-OF-FUNCTION>
            ? Which setting do you want to update? Lambda layers configuration
            ? Do you want to enable Lambda layers for this function? Yes
            ? Enter up to 5 existing Lambda layer ARNs (comma-separated): arn:aws:lambda:{aws::region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11
            ? Do you want to edit the local lambda function now? No
            ```

### Lambda Layer

[Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html){target="_blank"} is a `.zip` file archive that can contain additional code, pre-packaged dependencies, data, or configuration files. We compile and optimize [all dependencies](#install) to achieve an optimal build.

You can use the Lambda Layer both with CommonJS and ESM (ECMAScript modules) for Node.js 18.x and newer runtimes.

??? note "Click to expand and copy any regional Lambda Layer ARN"
    | Region           | Layer ARN                                                                                                     |
    | ---------------- | ------------------------------------------------------------------------------------------------------------- |
    | `us-east-1`      | [arn:aws:lambda:us-east-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `us-east-2`      | [arn:aws:lambda:us-east-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `us-west-1`      | [arn:aws:lambda:us-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `us-west-2`      | [arn:aws:lambda:us-west-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `ap-south-1`     | [arn:aws:lambda:ap-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:     |
    | `ap-east-1`      | [arn:aws:lambda:ap-east-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `ap-northeast-1` | [arn:aws:lambda:ap-northeast-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard: |
    | `ap-northeast-2` | [arn:aws:lambda:ap-northeast-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard: |
    | `ap-northeast-3` | [arn:aws:lambda:ap-northeast-3:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard: |
    | `ap-southeast-1` | [arn:aws:lambda:ap-southeast-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard: |
    | `ap-southeast-2` | [arn:aws:lambda:ap-southeast-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard: |
    | `ap-southeast-3` | [arn:aws:lambda:ap-southeast-3:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard: |
    | `ap-southeast-4` | [arn:aws:lambda:ap-southeast-4:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard: |
    | `eu-central-1`   | [arn:aws:lambda:eu-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:   |
    | `eu-central-2`   | [arn:aws:lambda:eu-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:   |
    | `eu-west-1`      | [arn:aws:lambda:eu-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `eu-west-2`      | [arn:aws:lambda:eu-west-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `eu-west-3`      | [arn:aws:lambda:eu-west-3:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `eu-north-1`     | [arn:aws:lambda:eu-north-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:     |
    | `eu-south-1`     | [arn:aws:lambda:eu-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:     |
    | `eu-south-2`     | [arn:aws:lambda:eu-south-2:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:     |
    | `ca-central-1`   | [arn:aws:lambda:ca-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:   |
    | `ca-west-1`      | [arn:aws:lambda:ca-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `sa-east-1`      | [arn:aws:lambda:sa-east-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:      |
    | `af-south-1`     | [arn:aws:lambda:af-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:     |
    | `me-south-1`     | [arn:aws:lambda:me-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:     |
    | `il-central-1`   | [arn:aws:lambda:il-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11](#){: .copyMe}:clipboard:   |

**Want to inspect the contents of the Layer?**

The pre-signed URL to download this Lambda Layer will be within `Location` key in the CLI output. The CLI output will also contain the Powertools for AWS Lambda version it contains.

Change `{aws::region}` to your AWS region, e.g. `eu-west-1`, and run the following command:

```bash title="AWS CLI command to download Lambda Layer content"
aws lambda get-layer-version-by-arn --arn arn:aws:lambda:{aws::region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11 --region {aws::region}
```

## Instrumentation

Many of the utilities provided by Powertools for AWS Lambda (TypeScript) can be used with different programming paradigms:

- **Middy** middleware. It is the best choice if your existing code base relies on the [Middy.js](https://middy.js.org/docs/) middleware engine. Powertools for AWS Lambda (TypeScript) offers compatible Middy middleware to make this integration seamless.
- **Method decorator**. Use [TypeScript method decorators](https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators) if you prefer writing your business logic using [TypeScript Classes](https://www.typescriptlang.org/docs/handbook/classes.html). If you aren’t using Classes, this requires the most significant refactoring.
- **Manually**. It provides the most granular control. It’s the most verbose approach, with the added benefit of no additional dependency and no refactoring to TypeScript Classes.

The examples in this documentation will feature all the approaches described above wherever applicable.

## Examples

You can find examples of how to use Powertools for AWS Lambda (TypeScript) in the [examples](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples/app){target="_blank"} directory. The application is a simple REST API that can be deployed via either AWS CDK or AWS SAM.

If instead you want to see Powertools for AWS Lambda (TypeScript) in slightly different use cases, check the [Serverless TypeScript Demo](https://github.com/aws-samples/serverless-typescript-demo) or the [AWS Lambda performance tuning](https://github.com/aws-samples/optimizations-for-lambda-functions) repository. Both demos use Powertools for AWS Lambda (TypeScript) as well as demonstrating other common techniques for Lambda functions written in TypeScript.

## Features

Core utilities such as Tracing, Logging, and Metrics will be available across all Powertools for AWS Lambda languages. Additional utilities are subjective to each language ecosystem and customer demand.

| Utility                                   | Description                                                                                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Tracer](./core/tracer.md)                | Decorators and utilities to trace Lambda function handlers, and both synchronous and asynchronous functions                                                       |
| [Logger](./core/logger.md)                | Structured logging made easier, and a middleware to enrich structured logging with key Lambda context details                                                     |
| [Metrics](./core/metrics.md)              | Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)                                                                                 |
| [Parameters](./utilities/parameters.md)   | High-level functions to retrieve one or more parameters from AWS SSM Parameter Store, AWS Secrets Manager, AWS AppConfig, and Amazon DynamoDB                     |
| [Idempotency](./utilities/idempotency.md) | Class method decorator, Middy middleware, and function wrapper to make your Lambda functions idempotent and prevent duplicate execution based on payload content. |
| [Batch Processing](./utilities/batch.md)  | Utility to handle partial failures when processing batches from Amazon SQS, Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.                             |
| [Parser](./utilities/parser.md)           | Utility to parse and validate AWS Lambda event payloads using Zod, a TypeScript-first schema declaration and validation library.                                  |

## Environment variables

???+ info
    Explicit parameters take precedence over environment variables

| Environment variable                         | Description                                                                                                   | Utility                                 | Default             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------- |
| **POWERTOOLS_SERVICE_NAME**                  | Set service name used for tracing namespace, metrics dimension and structured logging                         | All                                     | `service_undefined` |
| **POWERTOOLS_METRICS_NAMESPACE**             | Set namespace used for metrics                                                                                | [Metrics](core/metrics.md)              | `default_namespace` |
| **POWERTOOLS_TRACE_ENABLED**                 | Explicitly disables tracing                                                                                   | [Tracer](core/tracer.md)                | `true`              |
| **POWERTOOLS_TRACER_CAPTURE_RESPONSE**       | Capture Lambda or method return as metadata.                                                                  | [Tracer](core/tracer.md)                | `true`              |
| **POWERTOOLS_TRACER_CAPTURE_ERROR**          | Capture Lambda or method exception as metadata.                                                               | [Tracer](core/tracer.md)                | `true`              |
| **POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS** | Capture HTTP(s) requests as segments.                                                                         | [Tracer](core/tracer.md)                | `true`              |
| **POWERTOOLS_LOGGER_LOG_EVENT**              | Log incoming event                                                                                            | [Logger](core/logger.md)                | `false`             |
| **POWERTOOLS_LOGGER_SAMPLE_RATE**            | Debug log sampling                                                                                            | [Logger](core/logger.md)                | `0`                 |
| **POWERTOOLS_DEV**                           | Increase JSON indentation to ease debugging when running functions locally or in a non-production environment | [Logger](core/logger.md)                | `false`             |
| **POWERTOOLS_LOG_LEVEL**                     | Sets how verbose Logger should be, from the most verbose to the least verbose (no logs)                       | [Logger](core/logger.md)                | `INFO`              |
| **POWERTOOLS_PARAMETERS_MAX_AGE**            | Adjust how long values are kept in cache (in seconds)                                                         | [Parameters](utilities/parameters.md)   | `5`                 |
| **POWERTOOLS_PARAMETERS_SSM_DECRYPT**        | Set whether to decrypt or not values retrieved from AWS Systems Manager Parameters Store                      | [Parameters](utilities/parameters.md)   | `false`             |
| **POWERTOOLS_IDEMPOTENCY_DISABLED**          | Disable the Idempotency logic without changing your code, useful for testing                                  | [Idempotency](utilities/idempotency.md) | `false`             |

Each Utility page provides information on example values and allowed values.

## Support Powertools for AWS Lambda (TypeScript)

There are many ways you can help us gain future investments to improve everyone's experience:

<div class="grid cards" markdown>

- :heart:{ .lg .middle } __Become a public reference__

    ---

    Add your company name and logo on our [landing page](https://powertools.aws.dev), documentation, and README files.

    [:octicons-arrow-right-24: GitHub Issue template](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=customer-reference&projects=aws-powertools%2F7&template=support_powertools.yml&title=%5BSupport+Powertools+for+AWS+Lambda+%28TypeScript%29%5D%3A+%3Cyour+organization+name%3E){target="_blank"}

- :mega:{ .lg .middle } __Share your work__

    ---

    Blog posts, video, and sample projects about Powertools for AWS Lambda.

    [:octicons-arrow-right-24: GitHub Issue template](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=community-content&projects=aws-powertools%2F7&template=share_your_work.yml&title=%5BI+Made+This%5D%3A+%3CTITLE%3E){target="_blank"}

- :partying_face:{ .lg .middle } __Join the community__

    ---

    Connect, ask questions, and share what features you use.

    [:octicons-arrow-right-24: Discord invite](https://discord.gg/B8zZKbbyET){target="blank"}

</div>

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. The following companies, among others, use Powertools:

<div class="grid" style="text-align:center;" markdown>

[**Hashnode**](https://hashnode.com/){target="_blank" rel="nofollow"}
{ .card }

[**Caylent**](https://caylent.com/){target="_blank" rel="nofollow"}
{ .card }

[**Trek10)**](https://www.trek10.com/){target="_blank" rel="nofollow"}
{ .card }

[**Elva**](https://elva-group.com){target="_blank" rel="nofollow"}
{ .card }

[**globaldatanet**](https://globaldatanet.com/){target="_blank" rel="nofollow"}
{ .card }

[**Bailey Nelson**](https://www.baileynelson.com.au){target="_blank" rel="nofollow"}
{ .card }

[**Perfect Post**](https://www.perfectpost.fr){target="_blank" rel="nofollow"}
{ .card }

[**Sennder**](https://sennder.com/){target="_blank" rel="nofollow"}
{ .card }

[**Certible**](https://www.certible.com/){target="_blank" rel="nofollow"}
{ .card }

[**tecRacer GmbH & Co. KG**](https://www.tecracer.com/){target="_blank" rel="nofollow"}
{ .card }

[**AppYourself**](https://appyourself.net){target="_blank" rel="nofollow"}
{ .card }

[**Alma Media**](https://www.almamedia.fi/en/){target="_blank" rel="nofollow"}
{ .card }

[**Banxware**](https://www.banxware.com){target="_blank" rel="nofollow"}
{ .card }

[**WeSchool**](https://www.weschool.com){target="_blank" rel="nofollow"}
{ .card }

</div>

### Using Lambda Layers

!!! note "Layers help us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way."

When [using Layers](#lambda-layer), you can add Powertools for AWS Lambda (TypeScript) as a dev dependency to not impact the development process. For Layers, we pre-package all dependencies, compile and optimize for storage.

## Tenets

These are our core principles to guide our decision making.

- __AWS Lambda only__. We optimise for AWS Lambda function environments and supported runtimes only. Utilities might work with web frameworks and non-Lambda environments, though they are not officially supported.
- __Eases the adoption of best practices__. The main priority of the utilities is to facilitate best practices adoption, as defined in the AWS Well-Architected Serverless Lens; all other functionality is optional.
- __Keep it lean__. Additional dependencies are carefully considered for security and ease of maintenance, and prevent negatively impacting startup time.
- __We strive for backwards compatibility__. New features and changes should keep backwards compatibility. If a breaking change cannot be avoided, the deprecation and migration process should be clearly defined.
- __We work backwards from the community__. We aim to strike a balance of what would work best for 80% of customers. Emerging practices are considered and discussed via Requests for Comment (RFCs)
- __Progressive__. Utilities are designed to be incrementally adoptable for customers at any stage of their Serverless journey. They follow language idioms and their community’s common practices.
