---
title: JMESPath Functions
description: Utility
---

<!-- markdownlint-disable MD043 -->

Built-in [JMESPath](https://jmespath.org/){target="_blank" rel="nofollow"} functions to easily deserialize common encoded JSON payloads in Lambda functions.

## Key features

* Deserialize JSON from JSON strings, base64, and compressed data
* Use JMESPath to extract and combine data recursively
* Provides commonly used JMESPath expressions with popular event sources

## Getting started

### Installation

Install the utility in your project:

```sh
npm install @aws-lambda-powertools/jmespath
```

You might have events that contain encoded JSON payloads as string, base64, or even in compressed format. It is a common use case to decode and extract them partially or fully as part of your Lambda function invocation.

Powertools for AWS Lambda (TypeScript) also have utilities like [idempotency](idempotency.md){target="_blank"} where you might need to extract a portion of your data before using them.

???+ info "Terminology"
    **Envelope** is the terminology we use for the **JMESPath expression** to extract your JSON object from your data input. We might use those two terms interchangeably.

### Extracting data

You can use the `extractDataFromEnvelope` function with any [JMESPath expression](https://jmespath.org/tutorial.html){target="_blank" rel="nofollow"}.

???+ tip
	Another common use case is to fetch deeply nested data, filter, flatten, and more.

=== "extractDataFromBuiltinEnvelope.ts"
    ```typescript hl_lines="1 13 17 20 22"
    --8<-- "docs/snippets/jmespath/extractDataFromEnvelope.ts"
    ```

=== "extractDataFromEnvelope.json"

    ```json
    --8<-- "docs/snippets/jmespath/extractDataFromEnvelope.json"
    ```

### Built-in envelopes

We provide built-in envelopes for popular AWS Lambda event sources to easily decode and/or deserialize JSON objects.

=== "extractDataFromBuiltinEnvelope.ts"
    ```typescript hl_lines="2-3 15"
    --8<-- "docs/snippets/jmespath/extractDataFromBuiltinEnvelope.ts"
    ```

=== "extractDataFromBuiltinEnvelope.json"

    ```json hl_lines="6 15"
    --8<-- "docs/snippets/jmespath/extractDataFromBuiltinEnvelope.json"
    ```

These are all built-in envelopes you can use along with their expression as a reference:

<!-- markdownlint-disable MD056 -->
| Envelope                          | JMESPath expression                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| **`API_GATEWAY_HTTP`**            | `powertools_json(body)`                                                                   |
| **`API_GATEWAY_REST`**            | `powertools_json(body)`                                                                   |
| **`CLOUDWATCH_EVENTS_SCHEDULED`** | `detail`                                                                                  |
| **`CLOUDWATCH_LOGS`**             | `awslogs.powertools_base64_gzip(data)                                                     | powertools_json(@).logEvents[*]` |
| **`EVENTBRIDGE`**                 | `detail`                                                                                  |
| **`KINESIS_DATA_STREAM`**         | `Records[*].kinesis.powertools_json(powertools_base64(data))`                             |
| **`S3_EVENTBRIDGE_SQS`**          | `Records[*].powertools_json(body).detail`                                                 |
| **`S3_KINESIS_FIREHOSE`**         | `records[*].powertools_json(powertools_base64(data)).Records[0]`                          |
| **`S3_SNS_KINESIS_FIREHOSE`**     | `records[*].powertools_json(powertools_base64(data)).powertools_json(Message).Records[0]` |
| **`S3_SNS_SQS`**                  | `Records[*].powertools_json(body).powertools_json(Message).Records[0]`                    |
| **`S3_SQS`**                      | `Records[*].powertools_json(body).Records[0]`                                             |
| **`SNS`**                         | `Records[0].Sns.Message                                                                   | powertools_json(@)`              |
| **`SQS`**                         | `Records[*].powertools_json(body)`                                                        |
<!-- markdownlint-enable MD056 -->

???+ tip "Using SNS?"
    If you don't require SNS metadata, enable [raw message delivery](https://docs.aws.amazon.com/sns/latest/dg/sns-large-payload-raw-message-delivery.html). It will reduce multiple payload layers and size, when using SNS in combination with other services (_e.g., SQS, S3, etc_).

## Advanced

### Built-in JMESPath functions

You can use our built-in JMESPath functions within your envelope expression. They handle deserialization for common data formats found in AWS Lambda event sources such as JSON strings, base64, and uncompress gzip data.

#### `powertools_json` function

Use `powertools_json` function to decode any JSON string anywhere a JMESPath expression is allowed.

> **Idempotency scenario**

This sample will deserialize the JSON string within the `body` key before [Idempotency](./idempotency.md){target="_blank"} processes it.

=== "powertoolsJsonIdempotencyJmespath.ts"

    ```ts hl_lines="31"
    --8<-- "docs/snippets/jmespath/powertoolsJsonIdempotencyJmespath.ts"
    ```

=== "powertoolsJsonIdempotencyJmespath.json"

    ```json hl_lines="28"
    --8<-- "docs/snippets/jmespath/powertoolsJsonIdempotencyJmespath.json"
    ```

#### `powertools_base64` function

Use `powertools_base64` function to decode any base64 data.

This sample will decode the base64 value within the `data` key, and deserialize the JSON string before processing.

=== "powertoolsBase64Jmespath.ts"

    ```ts hl_lines="9"
    --8<-- "docs/snippets/jmespath/powertoolsBase64Jmespath.ts"
    ```

    1. The `data` variable contains the decoded object that looks like this:
    ```json
    {
        user_id: 123,
        product_id: 1,
        quantity: 2,
        price: 10.4,
        currency: 'USD',
    }
    ```

=== "powertoolsBase64JmespathPayload.json"

    ```json
    --8<-- "docs/snippets/jmespath/powertoolsBase64JmespathPayload.json"
    ```

#### `powertools_base64_gzip` function

Use `powertools_base64_gzip` function to decompress and decode base64 data.

This sample will decompress and decode base64 data from Cloudwatch Logs, then use JMESPath pipeline expression to pass the result for decoding its JSON string.

=== "powertoolsBase64GzipJmespath.ts"

    ```ts hl_lines="9"
    --8<-- "docs/snippets/jmespath/powertoolsBase64GzipJmespath.ts"
    ```

    1. The `payload` key contains a JSON object that once decompressed and decoded looks like this:
    ```json
    {
        "owner": "123456789012",
        "logGroup": "/aws/lambda/powertools-example",
        "logStream": "2020/09/02/[$LATEST]d3a8dcaffc7f4de2b8db132e3e106660",
        "subscriptionFilters": ["Destination"],
        "messageType": "DATA_MESSAGE",
        "logEvents": [
            {
                "id": "eventId1",
                "message": {
                    "username": "lessa",
                    "message": "hello world"
                },
                "timestamp": 1440442987000
            },
            {
                "id": "eventId2",
                "message": {
                    "username": "dummy",
                    "message": "hello world"
                },
                "timestamp": 1440442987001
            }
        ]
    }
    ```
    2. The `logGroup` variable contains the string `"/aws/lambda/powertools-example"`.

=== "powertoolsBase64GzipJmespathPayload.json"

    ```json
    --8<-- "docs/snippets/jmespath/powertoolsBase64GzipJmespathPayload.json"
    ```

### Bring your own JMESPath function

???+ warning
    This should only be used for advanced use cases where you have special formats not covered by the built-in functions.

For special binary formats that you want to decode before processing, you can bring your own JMESPath function by extending the `PowertoolsFunctions` class.

Here is an example of how to decompress messages compressed using the [Brotli compression algorithm](https://nodejs.org/api/zlib.html#zlibbrotlidecompressbuffer-options-callback){target="_blank" rel="nofollow"}:

=== "PowertoolsCustomFunction.ts"

    ```ts hl_lines="3 9 25-26"
    --8<--
     docs/snippets/jmespath/powertoolsCustomFunction.ts::8
     docs/snippets/jmespath/powertoolsCustomFunction.ts:10:

    --8<--
    ```

    1.  The function signature can be enforced at runtime by using the `@Functions.signature` decorator.
    2.  The name of the function must start with the `func` prefix.

=== "powertoolsCustomFunction.json"

    ```json
    --8<-- "docs/snippets/jmespath/powertoolsCustomFunction.json"
    ```
