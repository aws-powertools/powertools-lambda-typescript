---
title: Navigating the Toolkit
description: Getting to know the Powertools for AWS Lambda Toolkit
---

<!-- markdownlint-disable MD043 -->

## Instrumentation

Many of the utilities provided by Powertools for AWS Lambda (TypeScript) can be used with different programming paradigms:

- **Middy** middleware. It is the best choice if your existing code base relies on the [Middy.js](https://middy.js.org/docs/) middleware engine. Powertools for AWS Lambda (TypeScript) offers compatible Middy middleware to make this integration seamless.
- **Method decorator**. Use [TypeScript method decorators](https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators) if you prefer writing your business logic using [TypeScript Classes](https://www.typescriptlang.org/docs/handbook/classes.html). If you aren’t using Classes, this requires the most significant refactoring.
- **Manually**. It provides the most granular control. It’s the most verbose approach, with the added benefit of no additional dependency and no refactoring to TypeScript Classes.

The examples in this documentation will feature all the approaches described above wherever applicable.

## Examples

You can find examples of how to use Powertools for AWS Lambda (TypeScript) in the [examples](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples/app){target="_blank"} directory. The application is a simple REST API that can be deployed via either AWS CDK or AWS SAM.

If instead you want to see Powertools for AWS Lambda (TypeScript) in slightly different use cases, check the [Serverless TypeScript Demo](https://github.com/aws-samples/serverless-typescript-demo) or the [AWS Lambda performance tuning](https://github.com/aws-samples/optimizations-for-lambda-functions) repository.

Both demos use Powertools for AWS Lambda (TypeScript) as well as demonstrating other common techniques for Lambda functions written in TypeScript.
