---
title: Features
description: Features of Powertools for AWS Lambda
---

<!-- markdownlint-disable MD043 -->

<div class="grid cards" markdown>

- __Tracer__

    ---

    Instrument your code with minimal effort. Capture traces and metadata to understand the performance of your Lambda functions.

    [:octicons-arrow-right-24: Read more](./tracer.md)

- __Logger__

    ---

    JSON Structured logging made easier, key management, buffering, and Middy.js middleware to enrich structured logging with key Lambda context details.

    [:octicons-arrow-right-24: Read more](./logger.md)

- __Metrics__

    ---

    Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)

    [:octicons-arrow-right-24: Read more](./metrics.md)

- __Event Handler - AppSync Events__

    ---

    Event Handler for AWS AppSync real-time events

    [:octicons-arrow-right-24: Read more](./event-handler/appsync-events.md)

- __Parameters__

    ---

    High-level functions to retrieve one or more parameters from AWS SSM Parameter Store, AWS Secrets Manager, AWS AppConfig, and Amazon DynamoDB

    [:octicons-arrow-right-24: Read more](./parameters.md)

- __Idempotency__

    ---

    Class method decorator, Middy middleware, and function wrapper to make your Lambda functions idempotent and prevent duplicate execution based on payload content.

    [:octicons-arrow-right-24: Read more](./idempotency.md)

- __Batch Processing__

    ---

    Simplify the processing of batches of events with built-in support for SQS and DynamoDB Streams.

    [:octicons-arrow-right-24: Read more](./batch.md)

- __JMESPath Functions__

    ---

    Built-in JMESPath functions to easily deserialize common encoded JSON payloads in Lambda functions.

    [:octicons-arrow-right-24: Read more](./jmespath.md)

- __Parser__

    ---

    Utility to parse and validate AWS Lambda event payloads using Zod, a TypeScript-first schema declaration and validation library.

    [:octicons-arrow-right-24: Read more](./parser.md)

- __Validation__

    ---

    JSON Schema validation for events and responses, including JMESPath support to unwrap events before validation.

    [:octicons-arrow-right-24: Read more](./validation.md)

</div>
