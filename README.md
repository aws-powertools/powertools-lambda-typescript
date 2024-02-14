# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

[![Build](https://github.com/aws-powertools/powertools-lambda-typescript/actions/workflows/pr-run-linting-check-and-unit-tests.yml/badge.svg)]([https://github.com/aws-powertools/powertools-lambda-typescript/actions/workflows/pr-run-linting-check-and-unit-tests.yml])
![NodeSupport](https://img.shields.io/static/v1?label=node&message=%2016|%2018|%2020&color=green?style=flat-square&logo=node)
![GitHub Release](https://img.shields.io/github/v/release/aws-powertools/powertools-lambda-typescript?style=flat-square)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=aws-powertools_powertools-lambda-typescript&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=aws-powertools_powertools-lambda-typescript)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=aws-powertools_powertools-lambda-typescript&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=aws-powertools_powertools-lambda-typescript)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/aws-powertools/powertools-lambda-typescript/badge)](https://api.securityscorecards.dev/projects/github.com/aws-powertools/powertools-lambda-typescript)
[![Join our Discord](https://dcbadge.vercel.app/api/server/B8zZKbbyET?style=flat-square)](https://discord.gg/B8zZKbbyET)

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

> Also available in [Python](https://github.com/aws-powertools/powertools-lambda-python), [Java](https://github.com/aws-powertools/powertools-lambda-java), and [.NET](https://github.com/aws-powertools/powertools-lambda-dotnet).

**[Documentation](https://docs.powertools.aws.dev/lambda/typescript/)** | **[npm](https://www.npmjs.com/org/aws-lambda-powertools)** | **[Roadmap](https://docs.powertools.aws.dev/lambda/typescript/latest/roadmap)** | **[Examples](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples)** | **[Serverless TypeScript Demo](https://github.com/aws-samples/serverless-typescript-demo)**

## Table of contents <!-- omit in toc -->

- [Features](#features)
- [Getting started](#getting-started)
  - [Installation](#installation)
    - [Lambda layers](#lambda-layers)
    - [NPM modules](#npm-modules)
  - [Examples](#examples)
  - [Demo applications](#demo-applications)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
  - [Becoming a reference customer](#becoming-a-reference-customer)
  - [Sharing your work](#sharing-your-work)
  - [Using Lambda Layer](#using-lambda-layer)
- [Credits](#credits)
- [License](#license)

## Features

* **[Tracer](https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer/)** [![Downloads](https://img.shields.io/npm/dw/%40aws-lambda-powertools%2Ftracer.svg?style=flat-square
)](https://www.npmjs.com/package/@aws-lambda-powertools/tracer)
  * Utilities to trace Lambda function handlers, and both synchronous and asynchronous functions
* **[Logger](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/)** [![Downloads](https://img.shields.io/npm/dw/%40aws-lambda-powertools%2Flogger.svg?style=flat-square
)](https://www.npmjs.com/package/@aws-lambda-powertools/logger)
  * Structured logging made easier, and a middleware to enrich log items with key details of the Lambda context
* **[Metrics](https://docs.powertools.aws.dev/lambda/typescript/latest/core/metrics/)** [![Downloads](https://img.shields.io/npm/dw/%40aws-lambda-powertools%2Fmetrics.svg?style=flat-square
)](https://www.npmjs.com/package/@aws-lambda-powertools/metrics)
  * Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)
* **[Parameters](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/)** [![Downloads](https://img.shields.io/npm/dw/%40aws-lambda-powertools%2Fparameters.svg?style=flat-square
)](https://www.npmjs.com/package/@aws-lambda-powertools/parameters)
  * High-level functions to retrieve one or more parameters from AWS SSM Parameter Store, AWS Secrets Manager, AWS AppConfig, and Amazon DynamoDB
* **[Idempotency](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/)** [![Downloads](https://img.shields.io/npm/dw/%40aws-lambda-powertools%2Fidempotency.svg?style=flat-square
)](https://www.npmjs.com/package/@aws-lambda-powertools/idempotency)
  * Class method decorator, Middy middleware, and function wrapper to make your Lambda functions idempotent and prevent duplicate execution based on payload content
* **[Batch Processing](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/batch/)** [![Downloads](https://img.shields.io/npm/dw/%40aws-lambda-powertools%2Fbatch.svg?style=flat-square
)](https://www.npmjs.com/package/@aws-lambda-powertools/batch)
  * Utility to handle partial failures when processing batches from Amazon SQS, Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.

## Getting started

Find the complete project's [documentation here](https://docs.powertools.aws.dev/lambda/typescript).

### Installation

You have 2 ways of consuming those utilities:
* NPM modules
* Lambda Layer

#### Lambda layers

The Powertools for AWS Lambda (TypeScript) utilities is packaged as a single [AWS Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-concepts.html#gettingstarted-concepts-layer)

👉 [Installation guide for the **Powertools for AWS Lambda (TypeScript)** layer](https://docs.powertools.aws.dev/lambda/typescript/latest/#lambda-layer)

#### NPM modules

The Powertools for AWS Lambda (TypeScript) utilities follow a modular approach, similar to the official [AWS SDK v3 for JavaScript](https://github.com/aws/aws-sdk-js-v3).  
Each TypeScript utility is installed as standalone NPM package.

Install all three core utilities at once with this single command:

```shell
npm install @aws-lambda-powertools/logger @aws-lambda-powertools/tracer @aws-lambda-powertools/metrics
```

Or refer to the installation guide of each utility:

👉 [Installation guide for the **Tracer** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer#getting-started)

👉 [Installation guide for the **Logger** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger#getting-started)

👉 [Installation guide for the **Metrics** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/core/metrics#getting-started)

👉 [Installation guide for the **Parameters** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#getting-started)

👉 [Installation guide for the **Idempotency** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/#getting-started)

### Examples

* [CDK](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples/cdk)
* [SAM](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples/sam)

### Demo applications

The [Serverless TypeScript Demo](https://github.com/aws-samples/serverless-typescript-demo) shows how to use Powertools for AWS Lambda (TypeScript).  
You can find instructions on how to deploy and load test this application in the [repository](https://github.com/aws-samples/serverless-typescript-demo).

The [AWS Lambda performance tuning](https://github.com/aws-samples/optimizations-for-lambda-functions) repository also uses Powertools for AWS Lambda (TypeScript) as well as demonstrating other performance tuning techniques for Lambda functions written in TypeScript.

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues), or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub repository.

## Connect

* **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
* **Email**: aws-lambda-powertools-feedback@amazon.com

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E) issue.

The following companies, among others, use Powertools:

* [Hashnode](https://hashnode.com/)
* [Trek10](https://www.trek10.com/)
* [Elva](https://elva-group.com)
* [globaldatanet](https://globaldatanet.com/)
* [Bailey Nelson](https://www.baileynelson.com.au)
* [Perfect Post](https://www.perfectpost.fr)
* [Sennder](https://sennder.com/)
* [Certible](https://www.certible.com/)
* [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
* [AppYourself](https://appyourself.net)
* [Alma Media](https://www.almamedia.fi)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](#lambda-layers), you can add Powertools for AWS Lambda (TypeScript) as a dev dependency (or as part of your virtual env) to not impact the development process.

## Credits

Credits for the Powertools for AWS Lambda (TypeScript) idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## License

This library is licensed under the MIT-0 License. See the [LICENSE](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/LICENSE) file.
