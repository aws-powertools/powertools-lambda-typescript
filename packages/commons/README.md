# AWS Lambda Powertools for TypeScript <!-- omit in toc -->

Powertools is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

> Also available in [Python](https://github.com/awslabs/aws-lambda-powertools-python), [Java](https://github.com/awslabs/aws-lambda-powertools-java), and [.NET](https://awslabs.github.io/aws-lambda-powertools-dotnet/).

**[Documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/)** | **[npm](https://www.npmjs.com/org/aws-lambda-powertools)** | **[Roadmap](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/roadmap)** | **[Examples](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples)**

## Table of contents <!--- omit in toc -->

- [Table of contents ](#table-of-contents-)
- [Features](#features)
- [Getting started](#getting-started)
  - [Installation](#installation)
  - [Examples](#examples)
  - [Serverless TypeScript Demo application](#serverless-typescript-demo-application)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support AWS Lambda Powertools for TypeScript?](#how-to-support-aws-lambda-powertools-for-typescript)
  - [Becoming a reference customer](#becoming-a-reference-customer)
  - [Sharing your work](#sharing-your-work)
  - [Using Lambda Layer](#using-lambda-layer)
- [Credits](#credits)
- [License](#license)

## Features

* **[Tracer](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/)** - Utilities to trace Lambda function handlers, and both synchronous and asynchronous functions
* **[Logger](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger/)** - Structured logging made easier, and a middleware to enrich log items with key details of the Lambda context
* **[Metrics](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/metrics/)** - Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)
* **[Parameters (beta)](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/utilities/parameters/)** - High-level functions to retrieve one or more parameters from AWS SSM, Secrets Manager, AppConfig, and DynamoDB

## Getting started

Find the complete project's [documentation here](https://awslabs.github.io/aws-lambda-powertools-typescript).

### Installation

The AWS Lambda Powertools for TypeScript utilities follow a modular approach, similar to the official [AWS SDK v3 for JavaScript](https://github.com/aws/aws-sdk-js-v3).  

Each TypeScript utility is installed as standalone npm package.

Install all three core utilities at once with this single command:

```shell
npm install @aws-lambda-powertools/logger @aws-lambda-powertools/tracer @aws-lambda-powertools/metrics
```

Or refer to the installation guide of each utility:

👉 [Installation guide for the **Tracer** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer#getting-started)

👉 [Installation guide for the **Logger** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger#getting-started)

👉 [Installation guide for the **Metrics** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/metrics#getting-started)

👉 [Installation guide for the **Parameters** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/utilities/parameters/#getting-started)

### Examples

* [CDK](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples/cdk)
* [SAM](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples/sam)

### Serverless TypeScript Demo application

The [Serverless TypeScript Demo](https://github.com/aws-samples/serverless-typescript-demo) shows how to use Lambda Powertools for TypeScript.  
You can find instructions on how to deploy and load test this application in the [repository](https://github.com/aws-samples/serverless-typescript-demo).

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/awslabs/aws-lambda-powertools-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/awslabs/aws-lambda-powertools-typescript/issues), or [creating new ones](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new/choose), in this GitHub repository.

## Connect

* **AWS Lambda Powertools on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
* **Email**: aws-lambda-powertools-feedback@amazon.com

## How to support AWS Lambda Powertools for TypeScript?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using AWS Lambda Powertools for TypeScript, you can request to have your name and logo added to the README file by raising a [Support Lambda Powertools (become a reference)](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E){target="_blank"} issue.

The following companies, among others, use Powertools:

* [Hashnode](https://hashnode.com/)
* [Trek10](https://www.trek10.com/)
* [Elva](https://elva-group.com)
* [globaldatanet](https://globaldatanet.com/)
* [Bailey Nelson](https://www.baileynelson.com.au)
* [Perfect Post](https://www.perfectpost.fr)
* [Sennder](https://sennder.com/)

### Sharing your work

Share what you did with Powertools 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools [here](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools in a non-intrusive way, and helps us gain future investments for other Powertools languages. When [using Layers](#lambda-layers), you can add Powertools as a dev dependency (or as part of your virtual env) to not impact the development process.

## Credits

Credits for the Lambda Powertools idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
