---
title: Homepage
description: AWS Lambda Powertools for TypeScript
---

AWS Lambda Powertools for TypeScript provides a suite of utilities for AWS Lambda functions running on the Node.js runtime, to ease the adoption of best practices such as tracing, structured logging, custom metrics, and more.  

You can use the library in both TypeScript and JavaScript code bases.

## Tenets

Core utilities such as Tracer, Logger, Metrics, and Event Handler will be available across all Lambda Powertools runtimes. Additional utilities are subjective to each language ecosystem and customer demand.

* **AWS Lambda only**. We optimise for AWS Lambda function environments and supported runtimes only. Utilities might work with web frameworks and non-Lambda environments, though they are not officially supported.
* **Eases the adoption of best practices**. The main priority of the utilities is to facilitate best practices adoption, as defined in the AWS Well-Architected Serverless Lens; all other functionality is optional.
* **Keep it lean**. Additional dependencies are carefully considered for security and ease of maintenance, and prevent negatively impacting startup time.
* **We strive for backwards compatibility**. New features and changes should keep backwards compatibility. If a breaking change cannot be avoided, the deprecation and migration process should be clearly defined.
* **We work backwards from the community**. We aim to strike a balance of what would work best for 80% of customers. Emerging practices are considered and discussed via Requests for Comment (RFCs)
* **Progressive**. Utilities are designed to be incrementally adoptable for customers at any stage of their Serverless journey. They follow language idioms and their community’s common practices.

## Features

| Utility | Description
| ------------------------------------------------- | ---------------------------------------------------------------------------------
[Tracer](./core/tracer.md) | Trace Lambda function handlers, and both synchronous and asynchronous functions
[Logger](./core/logger.md) | Structured logging made easier, and a middleware to enrich log items with key details of the Lambda context
[Metrics](./core/metrics.md) | Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)

## Installation

You can use Powertools through [AWS Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-concepts.html#gettingstarted-concepts-layer) or install it as your dependency via NPM:

* **Lambda Layer**: [**arn:aws:lambda:{region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:3**](#){: .copyMe}:clipboard:
* **NPM**: **`npm install @aws-lambda-powertools/tracer @aws-lambda-powertools/metrics @aws-lambda-powertools/logger`**

???+ hint "Support this project by using Lambda Layers :heart:"
    Lambda Layers allow us to understand who uses this library in a non-intrusive way. This helps us justify and gain future investments for other Lambda Powertools languages.

    When using Layers, you can add Lambda Powertools as a dev dependency to not impact the development process.


### Lambda Layer

[Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html){target="_blank"} is a .zip file archive that can contain additional code, pre-packaged dependencies, data,  or configuration files. Layers promote code sharing and separation of responsibilities so that you can iterate faster on writing business logic.

You can include Lambda Powertools Lambda Layer using [AWS Lambda Console](https://docs.aws.amazon.com/lambda/latest/dg/invocation-layers.html#invocation-layers-using){target="_blank"}, or your preferred deployment framework.

??? note "Note: Expand to copy any regional Lambda Layer ARN"

    | Region | Layer ARN
    |--------------------------- | ---------------------------
    | `us-east-1` | [arn:aws:lambda:us-east-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `us-east-2` | [arn:aws:lambda:us-east-2:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `us-west-1` | [arn:aws:lambda:us-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `us-west-2` | [arn:aws:lambda:us-west-2:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `ap-south-1` | [arn:aws:lambda:ap-south-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `ap-northeast-1` | [arn:aws:lambda:ap-northeast-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `ap-northeast-2` | [arn:aws:lambda:ap-northeast-2:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `ap-northeast-3` | [arn:aws:lambda:ap-northeast-3:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `ap-southeast-1` | [arn:aws:lambda:ap-southeast-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `ap-southeast-2` | [arn:aws:lambda:ap-southeast-2:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `eu-central-1` | [arn:aws:lambda:eu-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `eu-west-1` | [arn:aws:lambda:eu-west-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `eu-west-2` | [arn:aws:lambda:eu-west-2:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `eu-west-3` | [arn:aws:lambda:eu-west-3:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `eu-north-1` | [arn:aws:lambda:eu-north-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `ca-central-1` | [arn:aws:lambda:ca-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:
    | `sa-east-1` | [arn:aws:lambda:sa-east-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3](#){: .copyMe}:clipboard:

??? question "Can't find our Lambda Layer for your preferred AWS region?"
    You can use our [CDK Layer Construct](https://github.com/aws-samples/cdk-lambda-powertools-python-layer){target="_blank"}, or NPM like you normally would for any other library.

    Please do file a feature request with the region you'd want us to prioritize making our Lambda Layer available.

=== "SAM"

    ```yaml hl_lines="5"
    MyLambdaFunction:
        Type: AWS::Serverless::Function
        Properties:
            Layers:
                - !Sub arn:aws:lambda:${AWS::Region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:3
    ```

=== "Serverless framework"

    ```yaml hl_lines="5"
	functions:
		hello:
		  handler: lambda_function.lambda_handler
		  layers:
			- arn:aws:lambda:${aws:region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:3
    ```

=== "CDK"

    ```typescript hl_lines="11 16"
    import * as cdk from 'aws-cdk-lib';
    import { Construct } from 'constructs';
    import * as lambda from 'aws-cdk-lib/aws-lambda';
    export class SampleFunctionWithLayer extends Construct {
        constructor(scope: Construct, id: string) {
            super(scope, id);
            // Create a Layer with AWS Lambda Powertools for TypeScript
            const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
            this,
            'PowertoolsLayer',
            `arn:aws:lambda:${cdk.Stack.of(this).region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:3`
            );
            new lambda.Function(this, 'Function', {
            runtime: lambda.Runtime.NODEJS_16_X,
            // Add the Layer to a Lambda function
            layers: [powertoolsLayer],
            code: lambda.Code.fromInline(`
            const { Logger } = require('@aws-lambda-powertools/logger');
            const { Metrics } = require('@aws-lambda-powertools/metrics');
            const { Tracer } = require('@aws-lambda-powertools/tracer');
            const logger = new Logger({logLevel: 'DEBUG'});
            const metrics = new Metrics();
            const tracer = new Tracer();
            exports.handler = function(event, ctx) {
                logger.debug("Hello World!"); 
            }`),
            handler: 'index.handler',
            });
        }
    }
    ```

=== "Terraform"

    ```terraform hl_lines="9 38"
    terraform {
      required_version = "~> 1.0.5"
      required_providers {
        aws = "~> 3.50.0"
      }
    }
    provider "aws" {
      region  = "{region}"
    }
    resource "aws_iam_role" "iam_for_lambda" {
      name = "iam_for_lambda"
      assume_role_policy = <<EOF
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Action": "sts:AssumeRole",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Effect": "Allow"
            }
          ]
        }
        EOF
	}
    resource "aws_lambda_function" "test_lambda" {
      filename      = "lambda_function_payload.zip"
      function_name = "lambda_function_name"
      role          = aws_iam_role.iam_for_lambda.arn
      handler       = "index.test"
      runtime 		= "nodejs16.x"
      layers 		= ["arn:aws:lambda:{region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:3"]
      source_code_hash = filebase64sha256("lambda_function_payload.zip")
    }
    ```

=== "Amplify"

    ```zsh
    # Create a new one with the layer
    ❯ amplify add function
    ? Select which capability you want to add: Lambda function (serverless function)
    ? Provide an AWS Lambda function name: <NAME-OF-FUNCTION>
    ? Choose the runtime that you want to use: NodeJS
    ? Do you want to configure advanced settings? Yes
    ...
    ? Do you want to enable Lambda layers for this function? Yes
    ? Enter up to 5 existing Lambda layer ARNs (comma-separated): arn:aws:lambda:eu-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3
    ❯ amplify push -y
    # Updating an existing function and add the layer
    ❯ amplify update function
    ? Select the Lambda function you want to update test2
    General information
    - Name: <NAME-OF-FUNCTION>
    ? Which setting do you want to update? Lambda layers configuration
    ? Do you want to enable Lambda layers for this function? Yes
    ? Enter up to 5 existing Lambda layer ARNs (comma-separated): arn:aws:lambda:eu-central-1:094274105915:layer:AWSLambdaPowertoolsTypeScript:3
    ? Do you want to edit the local lambda function now? No
    ```

=== "Get the Layer .zip contents"
	Change `{region}` to your AWS region, e.g. `eu-west-1`

    ```bash title="AWS CLI"
	aws lambda get-layer-version-by-arn --arn arn:aws:lambda:{region}:094274105915:layer:AWSLambdaPowertoolsTypeScript:3 --region {region}
    ```

    The pre-signed URL to download this Lambda Layer will be within `Location` key.

???+ warning "Warning: Limitations"

	Container Image deployment (OCI) or inline Lambda functions do not support Lambda Layers.

If you use `esbuild` to bundle your code, make sure to exclude `@aws-lambda-powertools`   from being bundled since the packages will be brought by the Layer:

=== "SAM" (check the [doc](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-build-typescript.html) for more details)

    ```yaml hl_lines="5"
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
                - '@aws-lambda-powertools/commons'
                - '@aws-lambda-powertools/logger'
                - '@aws-lambda-powertools/metrics'
                - '@aws-lambda-powertools/tracer'
    ```

=== "Serverless framework (check the [doc](https://floydspace.github.io/serverless-esbuild/) for more details)"

    ```yaml hl_lines="5"
	custom:
    esbuild:
      external:
        - '@aws-lambda-powertools/commons'
        - '@aws-lambda-powertools/logger'
        - '@aws-lambda-powertools/metrics'
        - '@aws-lambda-powertools/tracer'
    ```

=== "CDK (check the [doc](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.BundlingOptions.html#externalmodules) for more details)"

    ```typescript hl_lines="11 16"
            new awsLambdaNodejs.NodejsFunction(this, 'Function', {
              ...
              bundling: {
                externalModules: [
                  '@aws-lambda-powertools/commons',
                  '@aws-lambda-powertools/logger',
                  '@aws-lambda-powertools/metrics',
                  '@aws-lambda-powertools/tracer',
                ],
              }
            });
    ```

### NPM Modules

The AWS Lambda Powertools for TypeScript utilities (which from here will be referred as Powertools) follow a modular approach, similar to the official [AWS SDK v3 for JavaScript](https://github.com/aws/aws-sdk-js-v3).
Each TypeScript utility is installed as standalone NPM package.

Install all three core utilities at once with this single command:

```shell
npm install @aws-lambda-powertools/logger @aws-lambda-powertools/tracer @aws-lambda-powertools/metrics
```


Or refer to the installation guide of each utility: 

[Installation guide for the **Tracer** utility](./core/tracer.md#getting-started)

[Installation guide for the **Logger** utility](./core/logger.md#getting-started)

[Installation guide for the **Metrics** utility](./core/metrics.md#getting-started)

## Instrumentation

You can instrument your code with Powertools in three different ways:  

* **Middy** middleware. It is the best choice if your existing code base relies on the [Middy](https://middy.js.org/docs/) middleware engine. Powertools offers compatible Middy middleware to make this integration seamless.
* **Method decorator**. Use [TypeScript method decorators](https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators) if you prefer writing your business logic using [TypeScript Classes](https://www.typescriptlang.org/docs/handbook/classes.html). If you aren’t using Classes, this requires the most significant refactoring.
* **Manually**. It provides the most granular control. It’s the most verbose approach, with the added benefit of no additional dependency and no refactoring to TypeScript Classes.

The examples in this documentation will feature all the approaches described above, when applicable.

## Environment variables

!!! info
    **Explicit parameters passed in constructors or in middleware/decorators take precedence over environment variables.**

| Environment variable                         | Description                                                                            | Utility                   | Default               |
|----------------------------------------------|----------------------------------------------------------------------------------------|---------------------------|-----------------------|
| **POWERTOOLS_SERVICE_NAME**                  | Sets service name used for tracing namespace, metrics dimension and structured logging | All                       | `"service_undefined"` |
| **POWERTOOLS_METRICS_NAMESPACE**             | Sets namespace used for metrics                                                        | [Metrics](./core/metrics) | `None`                |
| **POWERTOOLS_TRACE_ENABLED**                 | Explicitly disables tracing                                                            | [Tracer](./core/tracer)   | `true`                |
| **POWERTOOLS_TRACER_CAPTURE_RESPONSE**       | Captures Lambda or method return as metadata.                                          | [Tracer](./core/tracer)   | `true`                |
| **POWERTOOLS_TRACER_CAPTURE_ERROR**          | Captures Lambda or method exception as metadata.                                       | [Tracer](./core/tracer)   | `true`                |
| **POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS** | Captures HTTP(s) requests as segments.                                                 | [Tracer](./core/tracer)   | `true`                |
| **POWERTOOLS_LOGGER_LOG_EVENT**              | Logs incoming event                                                                    | [Logger](./core/logger)   | `false`               |
| **POWERTOOLS_LOGGER_SAMPLE_RATE**            | Debug log sampling                                                                     | [Logger](./core/logger)   | `0`                   |
| **LOG_LEVEL**                                | Sets logging level                                                                     | [Logger](./core/logger)   | `INFO`                |

## Examples

* [CDK](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples/cdk){target="_blank"}
* [SAM](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples/sam){target="_blank"}

## Serverless TypeScript demo application

The [Serverless TypeScript Demo](https://github.com/aws-samples/serverless-typescript-demo) shows how to use Lambda Powertools for TypeScript.  
You can find instructions on how to deploy and load test this application in the [repository](https://github.com/aws-samples/serverless-typescript-demo).

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/awslabs/aws-lambda-powertools-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/awslabs/aws-lambda-powertools-typescript/issues), or [creating new ones](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new/choose), in this GitHub repository.

## Connect

* **AWS Lambda Powertools on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET){target="_blank"}**
* **Email**: aws-lambda-powertools-feedback@amazon.com

## Credits

Credits for the Lambda Powertools idea go to [DAZN](https://github.com/getndazn){target="_blank"} and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/){target="_blank"}.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](https://github.com/awslabs/aws-lambda-powertools-typescript/blob/main/LICENSE) file.

