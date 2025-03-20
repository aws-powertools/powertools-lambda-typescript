---
title: Parser (Zod)
descrition: Utility
---

<!-- markdownlint-disable MD043 --->

This utility provides data validation and parsing using [Zod](https://zod.dev){target="_blank"}, a TypeScript-first schema declaration and validation library.  

## Key features

* Define data schema as Zod schema, then parse, validate and extract only what you want
* Built-in envelopes to unwrap and validate popular AWS event sources payloads
* Extend and customize envelopes to fit your needs
* Safe parsing option to avoid throwing errors and custom error handling
* Available for Middy.js middleware and TypeScript method decorators

## Getting started

```bash
npm install @aws-lambda-powertools/parser zod@~3
```

This utility supports Zod v3.x and above.

## Define schema

You can define your schema using Zod:

```typescript title="schema.ts"
--8<-- "examples/snippets/parser/schema.ts"
```

This is a schema for `Order` object using Zod.
You can create complex schemas by using nested objects, arrays, unions, and other types, see [Zod documentation](https://zod.dev) for more details.

## Parse events

You can parse inbound events using `parser` decorator, Middy.js middleware, or [manually](#manual-parsing) using built-in envelopes and schemas.
Both are also able to parse either an object or JSON string as an input.

???+ warning
    The decorator and middleware will replace the event object with the parsed schema if successful.
    Be cautious when using multiple decorators that expect event to have a specific structure, the order of evaluation for decorators is from bottom to top.

=== "Middy middleware"
    ```typescript hl_lines="22"
    --8<-- "examples/snippets/parser/middy.ts"
    ```

=== "Decorator"
    ```typescript hl_lines="25"
    --8<-- "examples/snippets/parser/decorator.ts"
    ```

## Built-in schemas

Parser comes with the following built-in schemas:

| Model name                                   | Description                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| **AlbSchema**                                | Lambda Event Source payload for Amazon Application Load Balancer                      |
| **APIGatewayProxyEventSchema**               | Lambda Event Source payload for Amazon API Gateway                                    |
| **APIGatewayRequestAuthorizerEventSchema**   | Lambda Event Source payload for Amazon API Gateway Request Authorizer                 |
| **APIGatewayTokenAuthorizerEventSchema**     | Lambda Event Source payload for Amazon API Gateway Token Authorizer                   |
| **APIGatewayProxyEventV2Schema**             | Lambda Event Source payload for Amazon API Gateway v2 payload                         |
| **APIGatewayRequestAuthorizerEventV2Schema** | Lambda Event Source payload for Amazon API Gateway v2 Authorizer                      |
| **CloudFormationCustomResourceCreateSchema** | Lambda Event Source payload for AWS CloudFormation `CREATE` operation                 |
| **CloudFormationCustomResourceUpdateSchema** | Lambda Event Source payload for AWS CloudFormation `UPDATE` operation                 |
| **CloudFormationCustomResourceDeleteSchema** | Lambda Event Source payload for AWS CloudFormation `DELETE` operation                 |
| **CloudwatchLogsSchema**                     | Lambda Event Source payload for Amazon CloudWatch Logs                                |
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

=== "Middy middleware"
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

Parser comes with the following built-in envelopes:

| Envelope name                 | Behaviour                                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **apiGatewayEnvelope**        | 1. Parses data using `APIGatewayProxyEventSchema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                               |
| **apiGatewayV2Envelope**      | 1. Parses data using `APIGatewayProxyEventV2Schema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                             |
| **cloudWatchEnvelope**        | 1. Parses data using `CloudwatchLogsSchema` which will base64 decode and decompress it. <br/> 2. Parses records in `message` key using your schema and return them in a list.                                 |
| **dynamoDBStreamEnvelope**    | 1. Parses data using `DynamoDBStreamSchema`. <br/> 2. Parses records in `NewImage` and `OldImage` keys using your schema. <br/> 3. Returns a list with a dictionary containing `NewImage` and `OldImage` keys |
| **eventBridgeEnvelope**       | 1. Parses data using `EventBridgeSchema`. <br/> 2. Parses `detail` key using your schema and returns it.                                                                                                      |
| **kafkaEnvelope**             | 1. Parses data using `KafkaRecordSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                       |
| **kinesisEnvelope**           | 1. Parses data using `KinesisDataStreamSchema` which will base64 decode it. <br/> 2. Parses records in `Records` key using your schema and returns them in a list.                                            |
| **kinesisFirehoseEnvelope**   | 1. Parses data using `KinesisFirehoseSchema` which will base64 decode it. <br/> 2. Parses records in `Records` key using your schema and returns them in a list.                                              |
| **lambdaFunctionUrlEnvelope** | 1. Parses data using `LambdaFunctionUrlSchema`. <br/> 2. Parses `body` key using your schema and returns it.                                                                                                  |
| **snsEnvelope**               | 1. Parses data using `SnsSchema`. <br/> 2. Parses records in `body` key using your schema and return them in a list.                                                                                          |
| **snsSqsEnvelope**            | 1. Parses data using `SqsSchema`. <br/> 2. Parses SNS records in `body` key using `SnsNotificationSchema`. <br/> 3. Parses data in `Message` key using your schema and return them in a list.                 |
| **sqsEnvelope**               | 1. Parses data using `SqsSchema`. <br/> 2. Parses records in `body` key using your schema and return them in a list.                                                                                          |
| **vpcLatticeEnvelope**        | 1. Parses data using `VpcLatticeSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                        |
| **vpcLatticeV2Envelope**      | 1. Parses data using `VpcLatticeSchema`. <br/> 2. Parses `value` key using your schema and returns it.                                                                                                        |

## Safe parsing

If you want to parse the event without throwing an error, use the `safeParse` option.
The handler `event` object will be replaced with `ParsedResult<Input?, Oputput?>`, for example `ParsedResult<SqsEvent, Order>`, where `SqsEvent` is the original event and `Order` is the parsed schema.

The `ParsedResult` object will have `success`, `data`,  or `error` and `originalEvent` fields, depending on the outcome.
If the parsing is successful, the `data` field will contain the parsed event, otherwise you can access the `error` field and the `originalEvent` to handle the error and recover the original event.

=== "Middy middleware"
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

The package `@types/aws-lambda` is a popular project that contains type definitions for many AWS service event invocations.
Powertools parser utility also bring AWS Lambda event types based on the built-in schema definitions.

We recommend to use the types provided by the parser utility. If you encounter any issues or have any feedback, please [submit an issue](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose).

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
