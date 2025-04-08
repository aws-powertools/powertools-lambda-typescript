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

- :heart:{ .lg .middle } __Support this project__

    ---

    Become a public reference customer, share your work, contribute, use Lambda Layers, etc.

    [:octicons-arrow-right-24: Support](#support-powertools-for-aws)

- :material-file-code:{ .lg .middle } __Available languages__

    ---

    Powertools for AWS Lambda is also available in other languages

    :octicons-arrow-right-24: [Python](https://docs.powertools.aws.dev/lambda/python/latest/){target="_blank" }, [Java](https://docs.powertools.aws.dev/lambda/java/){target="_blank"}, and [.NET](https://docs.powertools.aws.dev/lambda/dotnet/){target="_blank"}

</div>

## Features

Powertools for AWS Lambda (TypeScript) is built as a modular toolkit, so you can pick and choose the utilities you want to use. The following table lists the available utilities, and links to their documentation.

| Utility                                      | Description                                                                                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- ------------------------------- |
| [Tracer](./features/tracer.md)               | Decorators and utilities to trace Lambda function handlers, and both synchronous and asynchronous functions                                                       |
| [Logger](./features/logger.md)               | Structured logging made easier, and a middleware to enrich structured logging with key Lambda context details                                                     |
| [Metrics](./features/metrics.md)             | Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)                                                                                 |
| [Parameters](./features/parameters.md)       | High-level functions to retrieve one or more parameters from AWS SSM Parameter Store, AWS Secrets Manager, AWS AppConfig, and Amazon DynamoDB                     |
| [Idempotency](./features/idempotency.md)     | Class method decorator, Middy middleware, and function wrapper to make your Lambda functions idempotent and prevent duplicate execution based on payload content. |
| [Batch Processing](./features/batch.md)      | Utility to handle partial failures when processing batches from Amazon SQS, Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.                             |
| [JMESPath Functions](./features/jmespath.md) | Built-in JMESPath functions to easily deserialize common encoded JSON payloads in Lambda functions.                                                               |
| [Parser](./features/parser.md)               | Utility to parse and validate AWS Lambda event payloads using Zod, a TypeScript-first schema declaration and validation library.                                  |
| [Validation](./features/validation.md)       | JSON Schema validation for events and responses, including JMESPath support to unwrap events before validation.                                                   |

## Examples

You can find examples of how to use Powertools for AWS Lambda (TypeScript) in the [examples](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples){target="_blank"} directory, which contains both code snippets for specific use cases, as well as a full example application.

If instead you want to see Powertools for AWS Lambda (TypeScript) in a more involved context, check the [Powertools for AWS workshop](https://github.com/aws-samples/powertools-for-aws-lambda-workshop/tree/main/functions/typescript) where we demonstrate how to use toolkit in a more complex application.

## Support Powertools for AWS

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

[**Alma Media**](https://www.almamedia.fi/en/){target="_blank" rel="nofollow"}
{ .card }

[**AppYourself**](https://appyourself.net){target="_blank" rel="nofollow"}
{ .card }

[**Bailey Nelson**](https://www.baileynelson.com.au){target="_blank" rel="nofollow"}
{ .card }

[**Banxware**](https://www.banxware.com){target="_blank" rel="nofollow"}
{ .card }

[**Caylent**](https://caylent.com/){target="_blank" rel="nofollow"}
{ .card }

[**Certible**](https://www.certible.com/){target="_blank" rel="nofollow"}
{ .card }

[**Elva**](https://elva-group.com){target="_blank" rel="nofollow"}
{ .card }

[**Flyweight**](https://flyweight.io/){target="_blank" rel="nofollow"}
{ .card }

[**globaldatanet**](https://globaldatanet.com/){target="_blank" rel="nofollow"}
{ .card }

[**Guild**](https://guild.com){target="_blank" rel="nofollow"}
{ .card }

[**Hashnode**](https://hashnode.com/){target="_blank" rel="nofollow"}
{ .card }

[**LocalStack**](https://localstack.cloud/){target="_blank" rel="nofollow"}
{ .card }

[**Perfect Post**](https://www.perfectpost.fr){target="_blank" rel="nofollow"}
{ .card }

[**Sennder**](https://sennder.com/){target="_blank" rel="nofollow"}
{ .card }

[**tecRacer GmbH & Co. KG**](https://www.tecracer.com/){target="_blank" rel="nofollow"}
{ .card }

[**Trek10**](https://www.trek10.com/){target="_blank" rel="nofollow"}
{ .card }

[**WeSchool**](https://www.weschool.com){target="_blank" rel="nofollow"}
{ .card }

</div>

### Using Lambda Layers

!!! note "Layers help us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way."

When [using Layers](./getting-started/lambda-layers.md), you can add Powertools for AWS Lambda (TypeScript) as a dev dependency to not impact the development process. For Layers, we pre-package all dependencies, compile and optimize for storage.

## Tenets

These are our core principles to guide our decision making.

- __AWS Lambda only__. We optimise for AWS Lambda function environments and supported runtimes only. Utilities might work with web frameworks and non-Lambda environments, though they are not officially supported.
- __Eases the adoption of best practices__. The main priority of the utilities is to facilitate best practices adoption, as defined in the AWS Well-Architected Serverless Lens; all other functionality is optional.
- __Keep it lean__. Additional dependencies are carefully considered for security and ease of maintenance, and prevent negatively impacting startup time.
- __We strive for backwards compatibility__. New features and changes should keep backwards compatibility. If a breaking change cannot be avoided, the deprecation and migration process should be clearly defined.
- __We work backwards from the community__. We aim to strike a balance of what would work best for 80% of customers. Emerging practices are considered and discussed via Requests for Comment (RFCs)
- __Progressive__. Utilities are designed to be incrementally adoptable for customers at any stage of their Serverless journey. They follow language idioms and their community’s common practices.
