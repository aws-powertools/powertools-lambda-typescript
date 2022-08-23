# AWS Lambda Powertools for TypeScript

A suite of utilities for AWS Lambda functions to ease the adoption of best practices such as tracing, structured logging, custom metrics, and more.

You can use the library in both TypeScript and JavaScript code bases.

AWS Lambda Powertools for [Python](https://github.com/awslabs/aws-lambda-powertools-python) and  AWS Lambda Powertools for [Java](https://github.com/awslabs/aws-lambda-powertools-java) are also available.

**[📜 Documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/)** | **[NPM](https://www.npmjs.com/org/aws-lambda-powertools)** | **[Roadmap](https://github.com/awslabs/aws-lambda-powertools-roadmap/projects/1)** | **[Examples](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples)** | **[Serverless TypeScript Demo](https://github.com/aws-samples/serverless-typescript-demo)**

## Table of contents

- [Features](#features)
- [Getting started](#getting-started)
  - [Installation](#installation)
  - [Examples](#examples)
  - [Serverless TypeScript Demo](#serverless-typescript-demo-application)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [Credits](#credits)
- [License](#license)

## Features

* **[Tracer](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/)** - Utilities to trace Lambda function handlers, and both synchronous and asynchronous functions
* **[Logger](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger/)** - Structured logging made easier, and a middleware to enrich log items with key details of the Lambda context
* **[Metrics](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/metrics/)** - Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)

## Getting started

Find the complete project's [documentation here](https://awslabs.github.io/aws-lambda-powertools-typescript).

### Installation

The AWS Lambda Powertools for TypeScript utilities follow a modular approach, similar to the official [AWS SDK v3 for JavaScript](https://github.com/aws/aws-sdk-js-v3).  
Each TypeScript utility is installed as standalone NPM package.

Install all three core utilities at once with this single command:

```shell
npm install @aws-lambda-powertools/logger @aws-lambda-powertools/tracer @aws-lambda-powertools/metrics
```

Or refer to the installation guide of each utility:

👉 [Installation guide for the **Tracer** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer#getting-started)

👉 [Installation guide for the **Logger** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger#getting-started)

👉 [Installation guide for the **Metrics** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/metrics#getting-started)

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

## Credits

Credits for the Lambda Powertools idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## License

This library is licensed under the MIT-0 License. See the LICENSE file.