# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

> Also available in [Python](https://github.com/aws-powertools/powertools-lambda-python), [Java](https://github.com/aws-powertools/powertools-lambda-java), and [.NET](https://github.com/aws-powertools/powertools-lambda-dotnet).

**[Documentation](https://docs.powertools.aws.dev/lambda/typescript/)** | **[npm](https://www.npmjs.com/org/aws-lambda-powertools)** | **[Roadmap](https://docs.powertools.aws.dev/lambda/typescript/latest/roadmap)** | **[Examples](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples)** | **[Serverless TypeScript Demo](https://github.com/aws-samples/serverless-typescript-demo)**

## Table of contents <!-- omit in toc -->

- [Features](#features)
- [Getting started](#getting-started)
  - [Installation](#installation)
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

* **[Tracer](https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer/)** - Utilities to trace Lambda function handlers, and both synchronous and asynchronous functions
* **[Logger](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/)** - Structured logging made easier, and a middleware to enrich log items with key details of the Lambda context
* **[Metrics](https://docs.powertools.aws.dev/lambda/typescript/latest/core/metrics/)** - Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)
* **[Parameters](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/)** - High-level functions to retrieve one or more parameters from AWS SSM, Secrets Manager, AppConfig, and DynamoDB

## Getting started

Find the complete project's [documentation here](https://docs.powertools.aws.dev/lambda/typescript).

### Installation

The Powertools for AWS Lambda (TypeScript) utilities follow a modular approach, similar to the official [AWS SDK v3 for JavaScript](https://github.com/aws/aws-sdk-js-v3).  

Each TypeScript utility is installed as standalone npm package.

Install all three core utilities at once with this single command:

```shell
npm install @aws-lambda-powertools/logger @aws-lambda-powertools/tracer @aws-lambda-powertools/metrics
```

Or refer to the installation guide of each utility:

👉 [Installation guide for the **Tracer** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/core/tracer#getting-started)

👉 [Installation guide for the **Logger** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger#getting-started)

👉 [Installation guide for the **Metrics** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/core/metrics#getting-started)

👉 [Installation guide for the **Parameters** utility](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/#getting-started)

### Examples

You can find examples of how to use Powertools for AWS Lambda (TypeScript) in the [examples](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples/app) directory. The application is a simple REST API that can be deployed via either AWS CDK or AWS SAM.

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

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Lambda Powertools for AWS Lambda (TypeScript) (become a reference)](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E) issue.

The following companies, among others, use Powertools:

* [Hashnode](https://hashnode.com/)
* [Caylent](https://caylent.com/)
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
* [Banxware](https://www.banxware.com)
* [Weschool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](#lambda-layers), you can add Powertools for AWS Lambda (TypeScript) as a dev dependency (or as part of your virtual env) to not impact the development process.

## Credits

Credits for the Powertools for AWS Lambda (TypeScript) idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## License

This library is licensed under the MIT-0 License. See the LICENSE file.