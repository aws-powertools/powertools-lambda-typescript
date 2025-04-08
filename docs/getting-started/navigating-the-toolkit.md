---
title: Navigating the Toolkit
description: Getting to know the Powertools for AWS Lambda Toolkit
---

<!-- markdownlint-disable MD043 -->

Powertools for AWS Lambda (TypeScript) is a collection of utilities designed to help you build serverless applications on AWS.

The toolkit is designed to be modular, so you can pick and choose the utilities you need for your application. Each utility is designed to be used independently, but they can also be used together to provide a complete solution for your serverless applications.

## Patterns

Many of the utilities provided can be used with different patterns, depending on your preferences and the structure of your code.

### Class Method Decorator

If you prefer writing your business logic using Object-Oriented Programming (OOP) and TypeScript Classes, the Class Method decorator pattern is a good fit. This approach lets you decorate class methods with Powertools utilities, applying their functionality with minimal code changes.

This pattern works well when you want to integrate Powertools for AWS Lambda (TypeScript) into an existing codebase without significant refactoring and with no additional runtime dependencies. Note that this approach relies on TypeScript's experimental decorator feature.

```ts
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics } from '@aws-lambda-powertools/metrics';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

class Lambda implements LambdaInterface {
  @tracer.captureLambdaHandler()
  @logger.injectLambdaContext()
  @metrics.logMetrics()
  async handler(event: unknown, context: Context) {
    // Your business logic here
  }
}
const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
```

### Middy.js Middleware

If your existing codebase relies on the [Middy.js](https://middy.js.org/docs/) middleware engine, you can use the Powertools for AWS Lambda (TypeScript) middleware to integrate with your existing code. This approach is similar to the Class Method decorator pattern but uses the Middy.js middleware engine to apply Powertools utilities.

```ts
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

export const handler = middy()
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger))
  .use(logMetrics(metrics))
  .handler(async (event: unknown) => {
    // Your business logic here
  });
```

### Functional Approach

If you prefer a more functional programming style, you can use the Powertools for AWS Lambda (TypeScript) utilities directly in your code without decorators or middleware. This approach is more verbose but provides the most control over how the utilities are applied.

```ts
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics } from '@aws-lambda-powertools/metrics';
import type { Context } from 'aws-lambda';

const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

export const handler = async (event: unknown, context: Context) => {
  logger.addContext(context);
  logger.logEventIfEnabled(event);

  const subsegment = tracer
    .getSegment()
    ?.addNewSubsegment('#### handler');

  try {
    // Your business logic here
  } catch (error) {
    logger.error('Error occurred', { error });
    tracer.addErrorAsMetadata(error);
  } finally {
    subsegment?.close();
    metrics.publishStoredMetrics();
  }
};
```
