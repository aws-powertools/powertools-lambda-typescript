# AWS Lambda Powertools for TypeScript

| ⚠️ **WARNING: Do not use this library in production** ⚠️                                                                                                                                                                                                                                                                                                                                             |
|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| AWS Lambda Powertools for TypeScript is currently released as a beta developer preview and is intended strictly for feedback purposes only.  <br/>This version is not stable, and significant breaking changes might incur as part of the upcoming [production-ready release](https://github.com/awslabs/aws-lambda-powertools-typescript/milestone/2).                                              |_


A suite of TypeScript utilities for AWS Lambda functions to ease adopting best practices such as tracing, structured logging, custom metrics, and more. (AWS Lambda Powertools for [Python](https://github.com/awslabs/aws-lambda-powertools-python) and AWS Lambda Powertools for [Java](https://github.com/awslabs/aws-lambda-powertools-java) are also available).

**[📜 Documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/)** | **[NPM](https://www.npmjs.com/org/aws-lambda-powertools)** | **[Roadmap](https://github.com/awslabs/aws-lambda-powertools-roadmap/projects/1)** | **[Examples](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples/cdk)**

> **An AWS Developer Acceleration (DevAx) initiative by Specialist Solution Architects | aws-devax-open-source@amazon.com**

## Features

* **[Tracer](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/)** - Utilities to trace Lambda function handlers, and both synchronous and asynchronous functions
* **[Logger](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger/)** - Structured logging made easier, and a middleware to enrich log items with key details of the Lambda context
* **[Metrics](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/metrics/)** - Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)

## Getting started

Find the complete project's [documentation here](https://awslabs.github.io/aws-lambda-powertools-typescript).

### Installation

The AWS Lambda Powertools for TypeScript utilities follow a modular approach, similar to the official [AWS SDK v3 for JavaScript](https://github.com/aws/aws-sdk-js-v3){target="_blank"}.
Each TypeScript utility is installed as standalone NPM package.

👉 [Installation guide for the **Tracer** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer#getting-started)

👉 [Installation guide for the **Logger** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger#getting-started)

👉 [Installation guide for the **Metrics** utility](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/metrics#getting-started)

### Examples

* [CDK](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/examples/cdk)
* [Tracer](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/packages/tracing/examples)
* [Logger](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/packages/logger/examples)
* [Metrics](https://github.com/awslabs/aws-lambda-powertools-typescript/tree/main/packages/metrics/examples)

## Credits

* Credits for the Lambda Powertools idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## Connect

* **AWS Developers Slack**: `#lambda-powertools`- **[Invite, if you don't have an account](https://join.slack.com/t/awsdevelopers/shared_invite/zt-yryddays-C9fkWrmguDv0h2EEDzCqvw)**
* **Email**: aws-lambda-powertools-feedback@amazon.com

## License

This library is licensed under the MIT-0 License. See the LICENSE file.