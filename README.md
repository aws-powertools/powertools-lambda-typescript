<!-- markdownlint-disable MD013  -->
# Powertools for AWS Lambda (TypeScript)

![NodeSupport](https://img.shields.io/static/v1?label=node&message=%2018|%2020|%2022&color=green?style=flat-square&logo=node)
![GitHub Release](https://img.shields.io/github/v/release/aws-powertools/powertools-lambda-typescript?style=flat-square)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=aws-powertools_powertools-lambda-typescript&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=aws-powertools_powertools-lambda-typescript)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=aws-powertools_powertools-lambda-typescript&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=aws-powertools_powertools-lambda-typescript)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/aws-powertools/powertools-lambda-typescript/badge)](https://api.securityscorecards.dev/projects/github.com/aws-powertools/powertools-lambda-typescript)
[![Join our Discord](https://dcbadge.vercel.app/api/server/B8zZKbbyET?style=flat-square)](https://discord.gg/B8zZKbbyET)

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

> Also available in [Python](https://github.com/aws-powertools/powertools-lambda-python), [Java](https://github.com/aws-powertools/powertools-lambda-java), and [.NET](https://github.com/aws-powertools/powertools-lambda-dotnet).

**[Documentation](https://docs.powertools.aws.dev/lambda/typescript/latest)** | **[npmjs.com](https://www.npmjs.com/org/aws-lambda-powertools)** | **[Roadmap](https://docs.powertools.aws.dev/lambda/typescript/latest/roadmap)** | **[Examples](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples)**

## Features

Find the complete project's [documentation here](https://docs.powertools.aws.dev/lambda/typescript/latest).

- **[Tracer](https://docs.powertools.aws.dev/lambda/typescript/latest/features/tracer/)** - Utilities to trace Lambda function handlers, and both synchronous and asynchronous functions
- **[Logger](https://docs.powertools.aws.dev/lambda/typescript/latest/features/logger/)** - Structured logging made easier, and a middleware to enrich log items with key details of the Lambda context
- **[Metrics](https://docs.powertools.aws.dev/lambda/typescript/latest/features/metrics/)** - Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)
- **[Event Handler](https://docs.powertools.aws.dev/lambda/typescript/latest/features/event-handler/)** - Lightweight routing to reduce boilerplate for API Gateway REST/HTTP API, ALB and Lambda Function URLs
- **[Parameters](https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/)** - High-level functions to retrieve one or more parameters from AWS SSM Parameter Store, AWS Secrets Manager, AWS AppConfig, and Amazon DynamoDB
- **[Idempotency](https://docs.powertools.aws.dev/lambda/typescript/latest/features/idempotency/)** - Class method decorator, Middy middleware, and function wrapper to make your Lambda functions idempotent and prevent duplicate execution based on payload content
- **[Batch Processing](https://docs.powertools.aws.dev/lambda/typescript/latest/features/batch/)** - Utility to handle partial failures when processing batches from Amazon SQS, Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.
- **[JMESPath Functions](https://docs.powertools.aws.dev/lambda/typescript/latest/features/jmespath/)** - Built-in JMESPath functions to easily deserialize common encoded JSON payloads in Lambda functions.
- **[Parser (Zod)](https://docs.powertools.aws.dev/lambda/typescript/latest/features/parser/)** - Utility that provides data validation and parsing using Zod, a TypeScript-first schema declaration and validation library.
- **[Validation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/validation/)** - JSON Schema validation for events and responses, including JMESPath support to unwrap events before validation.

## Install

You can use Powertools for AWS Lambda (TypeScript) by installing it with your favorite dependency management, or [via Lambda Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/getting-started/lambda-layers/). All features are available as individual packages, so you can install only the ones you need, for example:

- **Logger**: `npm install @aws-lambda-powertools/logger`
- **Metrics**: `npm install @aws-lambda-powertools/metrics`
- **Tracer**: `npm install @aws-lambda-powertools/tracer`
- **Event Handler**: `npm install @aws-lambda-powertools/event-handler`
- **Parameters**: `npm install @aws-lambda-powertools/parameters @aws-sdk/client-ssm` see [documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/#installation) for other providers
- **Idempotency**: `npm install @aws-lambda-powertools/idempotency @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb` see [documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/idempotency/#installation) for other providers
- **Batch Processing**: `npm install @aws-lambda-powertools/batch`
- **JMESPath Functions**: `npm install @aws-lambda-powertools/jmespath`
- **Parser**: `npm install @aws-lambda-powertools/parser zod@~3`
- **Validation**: `npm install @aws-lambda-powertools/validation`

### Examples

You can find examples of how to use Powertools for AWS Lambda (TypeScript) in the [examples](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples) directory. The directory contains code snippets around certain features as well as an is a simple REST API application that can be deployed via either AWS CDK or AWS SAM.

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E) issue.

The following companies, among others, use Powertools:

- [Alma Media](https://www.almamedia.fi)
- [AppYourself](https://appyourself.net)
- [Bailey Nelson](https://www.baileynelson.com.au)
- [Banxware](https://www.banxware.com)
- [Caylent](https://caylent.com/)
- [Certible](https://www.certible.com/)
- [Elva](https://elva-group.com)
- [Flyweight](https://flyweight.io/)
- [globaldatanet](https://globaldatanet.com/)
- [Guild](https://guild.com)
- [Hashnode](https://hashnode.com/)
- [LocalStack](https://localstack.cloud/)
- [Ours Privacy](https://oursprivacy.com/)
- [Perfect Post](https://www.perfectpost.fr)
- [Sennder](https://sennder.com/)
- [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
- [Trek10](https://www.trek10.com/)
- [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has [already shared](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this) about Powertools for AWS Lambda (TypeScript).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (Typescript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/getting-started/lambda-layers/), you can add Powertools for AWS Lambda as a dev dependency to not impact the development process.

## Credits

- Structured logging initial implementation from [aws-lambda-logging](https://gitlab.com/hadrien/aws_lambda_logging)
- Powertools for AWS Lambda idea [DAZN Powertools](https://github.com/getndazn/dazn-lambda-powertools/)

## Connect

- **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
- **Email**: <aws-powertools-maintainers@amazon.com>

## Security disclosures

If you think you’ve found a potential security issue, please do not post it in the Issues. Instead, please follow the [vulnerability reporting instructions](https://aws.amazon.com/security/vulnerability-reporting/) or [email AWS security directly](mailto:aws-security@amazon.com).

## License

This library is licensed under the MIT-0 License. See the [LICENSE](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/LICENSE) file.
