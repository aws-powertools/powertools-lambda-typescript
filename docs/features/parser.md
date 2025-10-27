---
title: Parser (Standard Schema)
descrition: Utility
---

<!-- markdownlint-disable MD043 --->

This utility provides data validation and parsing for [Standard Schema](https://github.com/standard-schema/standard-schema){target="_blank"}, together with a collection of built-in [Zod](https://zod.dev){target="_blank"} schemas and envelopes to parse and unwrap popular AWS event sources payloads.

## Key features

* Accept a [Standard Schema](https://github.com/standard-schema/standard-schema) and parse incoming payloads
* Built-in Zod schemas and envelopes to unwrap and validate popular AWS event sources payloads
* Extend and customize built-in Zod schemas to fit your needs
* Safe parsing option to avoid throwing errors and allow custom error handling
* Available as Middy.js middleware and TypeScript class method decorator

## Getting started

```bash
npm install @aws-lambda-powertools/parser zod
```

## Parse events

You can parse inbound events using `parser` decorator, Middy.js middleware, or [manually](#manual-parsing) using built-in envelopes and schemas.

When using the decorator or middleware, you can specify a schema to parse the event, this can be a [built-in Zod schema](#built-in-schemas) or a custom schema you defined. Custom schemas can be defined using Zod or any other [Standard Schema compatible library](https://standardschema.dev/#what-schema-libraries-implement-the-spec){target="_blank"}.

=== "Middy.js middleware with Zod schema"
    ```typescript hl_lines="22"
    --8<-- "examples/snippets/parser/middy.ts"
    ```

=== "Middy.js middleware with Valibot schema"
    ```typescript hl_lines="30"
    --8<-- "examples/snippets/parser/middyValibot.ts"
    ```

=== "Decorator"
    !!! warning
        The decorator and middleware will replace the event object with the parsed schema if successful.
        Be cautious when using multiple decorators that expect an event to have a specific structure, the order of evaluation for decorators is from the inner to the outermost decorator.

    ```typescript hl_lines="25"
    --8<-- "examples/snippets/parser/decorator.ts"
    ```

## Built-in schemas

**Parser** comes with the following built-in Zod schemas:

!!! note "Looking for other libraries?"
    The built-in schemas are defined using Zod, if you would like us to support other libraries like [valibot](https://valibot.dev){target="_blank"} please [open an issue](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?template=feature_request.yml){target="_blank"} and we will consider it based on the community's feedback.

| Model name                                   | Description                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| **AlbSchema**                                | Lambda Event Source payload for Amazon Application Load Balancer                      |
| **APIGatewayProxyEventSchema**               | Lambda Event Source payload for Amazon API Gateway                                    |
| **APIGatewayRequestAuthorizerEventSchema**   | Lambda Event Source payload for Amazon API Gateway Request Authorizer                 |
| **APIGatewayTokenAuthorizerEventSchema**     | Lambda Event Source payload for Amazon API Gateway Token Authorizer                   |
| **APIGatewayProxyEventV2Schema**             | Lambda Event Source payload for Amazon API Gateway v2 payload                         |
| **APIGatewayProxyWebsocketEventSchema**      | Lambda Event Source payload for Amazon API Gateway WebSocket events                   |
| **APIGatewayRequestAuthorizerEventV2Schema** | Lambda Event Source payload for Amazon API Gateway v2 Authorizer                      |
| **AppSyncResolverSchema**                    | Lambda Event Source payload for AWS AppSync GraphQL API resolver                      |
| **AppSyncBatchResolverSchema**               | Lambda Event Source payload for AWS AppSync GraphQL API batch resolver                |
| **AppSyncEventsPublishSchema**               | Lambda Event Source payload for AWS AppSync Events API `PUBLISH` operation            |
| **AppSyncEventsSubscribeSchema**             | Lambda Event Source payload for AWS AppSync Events API `SUBSCRIBE` operation          |
| **CloudFormationCustomResourceCreateSchema** | Lambda Event Source payload for AWS CloudFormation `CREATE` operation                 |
| **CloudFormationCustomResourceUpdateSchema** | Lambda Event Source payload for AWS CloudFormation `UPDATE` operation                 |
| **CloudFormationCustomResourceDeleteSchema** | Lambda Event Source payload for AWS CloudFormation `DELETE` operation                 |
| **CloudwatchLogsSchema**                     | Lambda Event Source payload for Amazon CloudWatch Logs                                |
| **PreSignupTriggerSchema**                   | Lambda Event Source payload for Amazon Cognito Pre Sign-up trigger                    |
| **PostConfirmationTriggerSchema**            | Lambda Event Source payload for Amazon Cognito Post Confirmation trigger              |
| **PreTokenGenerationTriggerSchema**          | Lambda Event Source payload for Amazon Cognito Pre Token Generation trigger           |
| **CustomMessageTriggerSchema**               | Lambda Event Source payload for Amazon Cognito Custom Message trigger                 |
| **MigrateUserTriggerSchema**                 | Lambda Event Source payload for Amazon Cognito User Migration trigger                 |
| **CustomSMSTriggerSchema**                   | Lambda Event Source payload for Amazon Cognito Custom SMS trigger                     |
| **CustomEmailTriggerSchema**                 | Lambda Event Source payload for Amazon Cognito Custom Email trigger                   |
| **DefineAuthChallengeTriggerSchema**         | Lambda Event Source payload for Amazon Cognito Define Auth Challenge trigger          |
| **CreateAuthChallengeTriggerSchema**         | Lambda Event Source payload for Amazon Cognito Create Auth Challenge trigger          |
| **VerifyAuthChallengeResponseTriggerSchema** | Lambda Event Source payload for Amazon Cognito Verify Auth Challenge Response trigger |
| **PreTokenGenerationTriggerSchemaV1**        | Lambda Event Source payload for Amazon Cognito Pre Token Generation trigger v1        |
| **PreTokenGenerationTriggerSchemaV2AndV3**   | Lambda Event Source payload for Amazon Cognito Pre Token Generation trigger v2 and v3 |
| **DynamoDBStreamSchema**                     | Lambda Event Source payload for Amazon DynamoDB Streams                               |
| **EventBridgeSchema**                        | Lambda Event Source payload for Amazon EventBridge                                    |
| **KafkaMskEventSchema**                      | Lambda Event Source payload for AWS MSK payload                                       |
| **KafkaSelfManagedEventSchema**              | Lambda Event Source payload for self managed Kafka payload                            |
| **KinesisDataStreamSchema**                  | Lambda Event Source payload for Amazon Kinesis Data Streams                           |
| **KinesisFirehoseSchema**                    | Lambda Event Source payload for Amazon Kinesis Firehose                               |
| **KinesisDynamoDBStreamSchema**              | Lambda Event Source payload for DynamodbStream record wrapped in Kinesis Data stream  |
| **KinesisFirehoseSqsSchema**                 | Lambda Event Source payload for SQS messages wrapped in Kinesis Firehose records      |
| **LambdaFunctionUrlSchema**                  | Lambda Event Source payload for Lambda Function URL payload                           |
| **S3EventNotificationEventBridgeSchema**     | Lambda Event Source payload for Amazon S3 Event Notification to EventBridge.          |
| **S3Schema**                                 | Lambda Event Source payload for Amazon S3                                             |
| **S3ObjectLambdaEvent**                      | Lambda Event Source payload for Amazon S3 Object Lambda                               |
| **S3SqsEventNotificationSchema**             | Lambda Event Source payload for S3 event notifications wrapped in SQS event (S3->SQS) |
| **SesSchema**                                | Lambda Event Source payload for Amazon Simple Email Service                           |
| **SnsSchema**                                | Lambda Event Source payload for Amazon Simple Notification Service                    |
| **SqsSchema**                                | Lambda Event Source payload for Amazon SQS                                            |
| **TransferFamilySchema**                     | Lambda Event Source payload for AWS Transfer Family events                            |
| **VpcLatticeSchema**                         | Lambda Event Source payload for Amazon VPC Lattice                                    |
| **VpcLatticeV2Schema**                       | Lambda Event Source payload for Amazon VPC Lattice v2 payload                         |

### Extend built-in schemas

You can extend every built-in schema to include your own schema, and yet have all other known fields parsed along the way.

=== "handler.ts"
    ```typescript hl_lines="23-25 30 34"
    --8<-- "examples/snippets/parser/extend.ts"
    ```

    1. Extend built-in `EventBridgeSchema` with your own detail schema
    2. Pass the extended schema to `parser` decorator or middy middleware
    3. `event` is validated including your custom schema and now available in your handler

=== "Example payload"

    ```json
    --8<-- "examples/snippets/parser/samples/examplePayload.json"
    ```

### JSON stringified payloads

If you want to extend a schema and transform a JSON stringified payload to an object, you can use helper function `JSONStringified`:

=== "AlbSchema with JSONStringified"
    ```typescript hl_lines="11"
    --8<-- "examples/snippets/parser/extendAlbSchema.ts"
    ```

    1. Extend built-in `AlbSchema` using JSONStringified function to transform your payload

=== "ALB example payload"

    ```json hl_lines="26"
    --8<-- "examples/snippets/parser/samples/exampleAlbPayload.json"
    ```

=== "APIGatewayProxyEventV2Schema with JSONStringified"
    ```typescript hl_lines="6"
    --8<--
     examples/snippets/parser/extendAPIGatewayProxyEventV2Schema.ts::4
     examples/snippets/parser/extendAPIGatewayProxyEventV2Schema.ts:6:
    --8<--
    ```

    1. This is compatible also with API Gateway REST API schemas

=== "API Gateway HTTP API example payload"

    ```json hl_lines="39"
    --8<-- "examples/snippets/parser/samples/exampleAPIGatewayProxyEventV2.json"
    ```

=== "SQS Schema with JSONStringified"
    ```typescript hl_lines="16"
    --8<-- "examples/snippets/parser/extendSqsSchema.ts"
    ```

=== "SQS example payload"

    ```json hl_lines="6 28"
    --8<-- "examples/snippets/parser/samples/exampleSqsPayload.json"
    ```

### DynamoDB Stream event parsing

If you want to parse a DynamoDB stream event with unmarshalling, you can use the helper function `DynamoDBMarshalled`:

=== "DynamoDBStreamSchema with DynamoDBMarshalled"
    ```typescript hl_lines="18"
    --8<-- "examples/snippets/parser/extendDynamoDBStreamSchema.ts"
    ```

=== "DynamoDBStream event payload"

    ```json hl_lines="13-20 49-56"
    --8<-- "examples/snippets/parser/samples/exampleDynamoDBStreamPayload.json"
    ```

## Envelopes

When trying to parse your payload you might encounter the following situations:

* Your actual payload is wrapped around a known structure, for example Lambda Event Sources like EventBridge
* You're only interested in a portion of the payload, for example parsing the detail of custom events in EventBridge, or body of SQS records
* You can either solve these situations by creating a schema of these known structures, parsing them, then extracting and parsing a key where your payload is.

This can become difficult quite quickly. Parser simplifies the development through a feature named Envelope.
Envelopes can be used via envelope parameter available in middy and decorator.
Here's an example of parsing a custom schema in an event coming from EventBridge, where all you want is what's inside the detail key.

=== "Middy.js middleware"
    ```typescript hl_lines="23"
    --8<-- "examples/snippets/parser/envelopeMiddy.ts"
    ```

=== "Decorator"
    ```typescript hl_lines="26"
    --8<-- "examples/snippets/parser/envelopeDecorator.ts"
    ```

    1. Pass `eventBridgeEnvelope` to `parser` decorator
    2. `event` is parsed and replaced as `Order` object

The envelopes are functions that take an event and the schema to parse, and return the result of the inner schema.
Depending on the envelope it can be something simple like extracting a key.
We have also complex envelopes that parse the payload from a string, decode base64, uncompress gzip, etc.

!!! tip "Envelopes vs schema extension"
    Use envelopes if you want to extract only the inner part of an event payload and don't use the information from the Lambda event.
    Otherwise, extend built-in schema to parse the whole payload and use the metadata from the Lambda event.

### Built-in envelopes

Parser comes with the following built-in Zod envelopes:

!!! note "Looking for other libraries?"
    The built-in schemas are defined using Zod, if you would like us to support other libraries like [valibot](https://valibot.dev){target="_blank"} please [open an issue](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?template=feature_request.yml){target="_blank"} and we will consider it based on the community's feedback.

| Envelope name                 | Behaviour                                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ApiGatewayEnvelope**        | 1. Parses data using `APIGatewayProxyEventSchema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                               |
| **ApiGatewayV2Envelope**      | 1. Parses data using `APIGatewayProxyEventV2Schema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                             |
| **CloudWatchEnvelope**        | 1. Parses data using `CloudwatchLogsSchema` which will base64 decode and decompress it. <br/> 2. Parses records in `message` key using your schema and return them in a list.                                 |
| **DynamoDBStreamEnvelope**    | 1. Parses data using `DynamoDBStreamSchema`. <br/> 2. Parses records in `NewImage` and `OldImage` keys using your schema. <br/> 3. Returns a list with a dictionary containing `NewImage` and `OldImage` keys |
| **EventBridgeEnvelope**       | 1. Parses data using `EventBridgeSchema`. <br/> 2. Parses `detail` key using your schema and returns it.                                                                                                      |
| **KafkaEnvelope**             | 1. Parses data using `KafkaRecordSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                       |
| **KinesisEnvelope**           | 1. Parses data using `KinesisDataStreamSchema` which will base64 decode it. <br/> 2. Parses records in `Records` key using your schema and returns them in a list.                                            |
| **KinesisFirehoseEnvelope**   | 1. Parses data using `KinesisFirehoseSchema` which will base64 decode it. <br/> 2. Parses records in `Records` key using your schema and returns them in a list.                                              |
| **LambdaFunctionUrlEnvelope** | 1. Parses data using `LambdaFunctionUrlSchema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                                  |
| **SnsEnvelope**               | 1. Parses data using `SnsSchema`. <br/> 2. Parses records in `body` key using your schema and return them in a list.                                                                                          |
| **SnsSqsEnvelope**            | 1. Parses data using `SqsSchema`. <br/> 2. Parses SNS records in `body` key using `SnsNotificationSchema`. <br/> 3. Parses data in `Message` key using your schema and return them in a list.                 |
| **SnsEnvelope**               | 1. Parses data using `SqsSchema`. <br/> 2. Parses records in `body` key using your schema and return them in a list.                                                                                          |
| **VpcLatticeEnvelope**        | 1. Parses data using `VpcLatticeSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                        |
| **VpcLatticeV2Envelope**      | 1. Parses data using `VpcLatticeSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                        |

## Safe parsing

If you want to parse the event without throwing an error, use the `safeParse` option.
The handler `event` object will be replaced with `ParsedResult<Input?, Oputput?>`, for example `ParsedResult<SqsEvent, Order>`, where `SqsEvent` is the original event and `Order` is the parsed schema.

The `ParsedResult` object will have `success`, `data`,  or `error` and `originalEvent` fields, depending on the outcome.
If the parsing is successful, the `data` field will contain the parsed event, otherwise you can access the `error` field and the `originalEvent` to handle the error and recover the original event.

=== "Middy.js middleware"
    ```typescript hl_lines="23 28 32-33"
    --8<-- "examples/snippets/parser/safeParseMiddy.ts"
    ```

    1. Use `safeParse` option to parse the event without throwing an error
    2. Use `data` to access the parsed event when successful
    3. Use `error` to handle the error message
    4. Use `originalEvent` to get the original event and recover

=== "Decorator"
    ```typescript hl_lines="33 41 45-46"
    --8<-- "examples/snippets/parser/safeParseDecorator.ts"
    ```

    1. Use `safeParse` option to parse the event without throwing an error
    2. Use `data` to access the parsed event when successful
    3. Use `error` to handle the error message
    4. Use `originalEvent` to get the original event and recover

## Manual parsing

You can use built-in envelopes and schemas to parse the incoming events manually, without using middy or decorator.

=== "Manual parse"
    ```typescript hl_lines="28 31"
    --8<-- "examples/snippets/parser/manual.ts"
    ```

    1. Use `EventBridgeSchema` to parse the event, the `details` fields will be parsed as a generic record.
    2. Use `eventBridgeEnvelope` with a combination of `orderSchema` to get `Order` object from the `details` field.

=== "Manual safeParse"
    ```typescript hl_lines="27 31"
    --8<-- "examples/snippets/parser/manualSafeParse.ts"
    ```

    1. Use `safeParse` option to parse the event without throwing an error
    2. `safeParse` is also available for envelopes

## Custom validation

Because Parser uses Zod, you can use all the features of Zod to validate your data.
For example, you can use `refine` to validate a field or a combination of fields:

=== "Custom validation"
    ```typescript hl_lines="13 18"
    --8<-- "examples/snippets/parser/refine.ts"
    ```

    1. validate a single field
    2. validate an object with multiple fields

Zod provides a lot of other features and customization, see [Zod documentation](https://zod.dev) for more details.

## Types

### Schema and Type inference

Use `z.infer` to extract the type of the schema, so you can use types during development and avoid type errors.

=== "Types"
    ```typescript hl_lines="22 25 30"
    --8<-- "examples/snippets/parser/types.ts"
    ```

    1. Use `z.infer` to extract the type of the schema, also works for nested schemas
    2. `event` is of type `Order`
    3. infer types from deeply nested schemas 

### Compatibility with `@types/aws-lambda`

The package `@types/aws-lambda` is a popular project that contains type definitions for many AWS service event invocations, support for these types is provided on a best effort basis.

We recommend using the types provided by the Parser utility under `@aws-powertools/parser/types` when using the built-in schemas and envelopes, as they are inferred directly from the Zod schemas and are more accurate.

If you encounter any type compatibility issues with `@types/aws-lambda`, please [submit an issue](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose).

## Testing your code

When testing your handler with [**parser decorator**](#parse-events) you need to use double assertion to bypass TypeScript type checking in your tests.
This is useful when you want to test the handler for invalid payloads or when you want to test the error handling.
If you are you use middy middleware, you don't need to do this.

=== "handlerDecorator.test.ts"

    ```typescript hl_lines="27"
    --8<-- "examples/snippets/parser/unitTestDecorator.ts"
    ```
    
    1. Use double assertion `as unknown as X` to bypass TypeScript type checking in your tests

=== "handlerDecorator.ts"

    ```typescript
    --8<-- "examples/snippets/parser/handlerDecorator.ts"
    ```

=== "schema.ts"

    ```typescript
    --8<-- "examples/snippets/parser/schema.ts"
    ```

This also works when using `safeParse` option.

=== "handlerSafeParse.test.ts"

    ```typescript hl_lines="21-30 36 46"
    --8<-- "examples/snippets/parser/unitTestSafeParse.ts"
    ```
    
    1. Use double assertion to pass expected types to the handler

=== "handlerSafeParse.ts"

    ```typescript
    --8<-- "examples/snippets/parser/handlerSafeParseDecorator.ts"
    ```

=== "schema.ts"

    ```typescript
    --8<-- "examples/snippets/parser/schema.ts"
    ```

## Should I use this or Validation?

One of Powertools for AWS Lambda [tenets](../index.md#tenets) is to be progressive. This means that our utilities are designed to be incrementally adopted by customers at any stage of their serverless journey.

For new projects, especially those using TypeScript, we recommend using the Parser utility. Thanks to its integration with [Zod](http://zod.dev), it provides an expressive and type-safe way to validate and parse payloads.

If instead you are already using JSON Schema, or simply feel more comfortable with it, the [Validation](validation.md) utility is a great choice. It provides an opinionated thin layer on top of the popular [ajv](https://ajv.js.org) library, with built-in support for JMESPath and AWS service envelopes.

When it comes to feature set, besides the type-safe parsing, the Parser utility also provides a rich collection of built-in schemas and envelopes for AWS services. The Validation utility, on the other hand, follows a more bring-your-own-schema approach, with built-in support for JMESPath and AWS service envelopes to help you unwrap events before validation.

Additionally, while both utilities serve specific use cases, understanding your project requirements will help you choose the right tool for your validation needs.

Finally, in terms of bundle size, the Validation utility is slightly heavier than the Parser utility primarily due to ajv not providing ESM builds. However, even with this, the Validation utility still clocks in at under ~100KB when minified and bundled.
