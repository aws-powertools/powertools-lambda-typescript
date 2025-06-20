---
title: Kafka Consumer
description: Utility
status: new
---

The Kafka Consumer utility transparently handles message deserialization, provides an intuitive developer experience, and integrates seamlessly with the rest of the Powertools for AWS Lambda ecosystem.

```mermaid
--8<-- "examples/snippets/kafka/diagrams/intro.mermaid"
```

## Key features

* Automatic deserialization of Kafka messages (JSON, Avro, and Protocol Buffers)
* Simplified event record handling with intuitive interface
* Support for key and value deserialization
* Support for [Standard Schema](https://github.com/standard-schema/standard-schema) output parsing (e.g., Zod, Valibot, ArkType)
* Support for Event Source Mapping (ESM) with and without Schema Registry integration
* Out of the box error handling for deserialization issues

## Terminology

**Event Source Mapping (ESM)**  A Lambda feature that reads from streaming sources (like Kafka) and invokes your Lambda function. It manages polling, batching, and error handling automatically, eliminating the need for consumer management code.

**Record Key and Value** A Kafka messages contain two important parts: an optional key that determines the partition and a value containing the actual message data. Both are base64-encoded in Lambda events and can be independently deserialized.

**Deserialization** The process of converting binary data (base64-encoded in Lambda events) into usable Python objects according to a specific format like JSON, Avro, or Protocol Buffers. Powertools handles this conversion automatically.

**SchemaConfig class** Contains parameters that tell Powertools how to interpret message data, including the format type (JSON, Avro, Protocol Buffers) and optional schema definitions needed for binary formats.

**Output parsing** A [Standard Schema](https://github.com/standard-schema/standard-schema) used to parse your data at runtime, allowing you to define how the deserialized data should be structured and validated.

**Schema Registry** A centralized service that stores and validates schemas, ensuring producers and consumers maintain compatibility when message formats evolve over time.

## Moving from traditional Kafka consumers

Lambda processes Kafka messages as discrete events rather than continuous streams, requiring a different approach to consumer development that Powertools for AWS helps standardize.

| Aspect                | Traditional Kafka Consumers         | Lambda Kafka Consumer                                          |
|-----------------------|-------------------------------------|----------------------------------------------------------------|
| **Model**             | Pull-based (you poll for messages)  | Push-based (Lambda invoked with messages)                      |
| **Scaling**           | Manual scaling configuration        | Automatic scaling to partition count                           |
| **State**             | Long-running application with state | Stateless, ephemeral executions                                |
| **Offsets**           | Manual offset management            | Automatic offset commitment                                    |
| **Schema Validation** | Client-side schema validation       | Optional Schema Registry integration with Event Source Mapping |
| **Error Handling**    | Per-message retry control           | Batch-level retry policies                                     |

## Getting started

### Installation

Depending on the schema types you want to use, install the library and the corresponding libraries:

=== "JSON"
	```bash
	npm install @aws-lambda-powertools/kafka
	```

=== "Avro"
	```bash
	npm install @aws-lambda-powertools/kafka avro-js
	```

=== "Protobuf"
	```bash
	npm install @aws-lambda-powertools/kafka protobufjs
	```

Additionally, if you want to use output parsing with [Standard Schema](https://github.com/standard-schema/standard-schema), you can install [any of the supported libraries](https://standardschema.dev/#what-schema-libraries-implement-the-spec), for example: Zod, Valibot, or ArkType.

<!-- ### Required resources

To use the Kafka consumer utility, you need an AWS Lambda function configured with a Kafka event source. This can be Amazon MSK, MSK Serverless, or a self-hosted Kafka cluster.

=== "gettingStartedWithMsk.yaml"

    ```yaml
    --8<-- "examples/snippets/kafka/templates/gettingStartedWithMsk.yaml"
    ``` -->

### Using ESM with Schema Registry

The Event Source Mapping configuration determines which mode is used. With `JSON`, Lambda converts all messages to JSON before invoking your function. With `SOURCE` mode, Lambda preserves the original format, requiring you function to handle the appropriate deserialization.

Powertools for AWS supports both Schema Registry integration modes in your Event Source Mapping configuration.

### Processing Kafka events

The Kafka consumer utility transforms raw Kafka events into an intuitive format for processing. To handle messages effectively, you'll need to configure a schema that matches your data format.

???+ tip "Using Avro is recommended"
    We recommend Avro for production Kafka implementations due to its schema evolution capabilities, compact binary format, and integration with Schema Registry. This offers better type safety and forward/backward compatibility compared to JSON.

=== "Avro Messages"

    ```typescript hl_lines="2-3 8-13 15 19"
    --8<-- "examples/snippets/kafka/gettingStartedAvro.ts"
    ```

=== "Protocol Buffers"

    ```typescript hl_lines="1-2 8-13 15 19"
    --8<-- "examples/snippets/kafka/gettingStartedProtobuf.ts"
    ```
    
=== "JSON Messages"

    ```typescript hl_lines="1-2 7-11 13 17"
    --8<-- "examples/snippets/kafka/gettingStartedJson.ts"
    ```

### Deserializing keys and values

The `kafkaConsumer` function can deserialize both keys and values independently based on your schema configuration. This flexibility allows you to work with different data formats in the same message.

=== "index.ts"

    ```typescript hl_lines="9 13 22 25-26"
    --8<-- "examples/snippets/kafka/gettingStartedKeyValue.ts:func"
    ```

=== "types.ts"

    ```typescript
    --8<-- "examples/snippets/kafka/gettingStartedKeyValue.ts:types"
    ```

=== "ProductKey.avsc"

    ```json
    --8<-- "examples/snippets/kafka/gettingStartedKeyValue.ts:2:8"
    ```

=== "ProductInfo.avsc"

    ```json
    --8<-- "examples/snippets/kafka/gettingStartedKeyValue.ts:12:20"
    ```

You can configure the `kafkaConsumer` to handle only the value. This allows you to optimize your Lambda function for the specific data structure of your Kafka messages.

### Handling primitive types

When working with primitive data types (strings, integers, etc.) rather than structured objects, you can simplify your configuration by omitting the schema specification for that component. Powertools for AWS will deserialize the value always as a string.

???+ tip "Common pattern: Keys with primitive values"
    Using primitive types (strings, integers) as Kafka message keys is a common pattern for partitioning and identifying messages. The Kafka consumer automatically handles these primitive keys without requiring special configuration, making it easy to implement this popular design pattern.

=== "Primitive key"

    ```typescript
    --8<-- "examples/snippets/kafka/gettingStartedPrimitiveValues.ts"
    ```

### Message format support and comparison

The Kafka consumer utility supports multiple serialization formats to match your existing Kafka implementation. Choose the format that best suits your needs based on performance, schema evolution requirements, and ecosystem compatibility.

???+ tip "Selecting the right format"
    For new applications, consider Avro or Protocol Buffers over JSON. Both provide schema validation, evolution support, and significantly better performance with smaller message sizes. Avro is particularly well-suited for Kafka due to its built-in schema evolution capabilities.

=== "Supported Formats"

    | Format               | Schema Type  | Description                       | Required Parameters                  |
    |----------------------|--------------|-----------------------------------|--------------------------------------|
    | **JSON**             | `"JSON"`     | Human-readable text format        | None                                 |
    | **Avro**             | `"AVRO"`     | Compact binary format with schema | `value.schema` (Avro schema string)  |
    | **Protocol Buffers** | `"PROTOBUF"` | Efficient binary format           | `value.schema` (Proto message class) |

=== "Format Comparison"

    | Feature                       | JSON     | Avro                 | Protocol Buffers        |
    |-------------------------------|----------|----------------------|-------------------------|
    | **Schema Definition**         | Optional | Required JSON schema | Required Protobuf class |
    | **Schema Evolution**          | None     | Strong support       | Strong support          |
    | **Size Efficiency**           | Low      | High                 | Highest                 |
    | **Processing Speed**          | Slower   | Fast                 | Fastest                 |
    | **Human Readability**         | High     | Low                  | Low                     |
    | **Implementation Complexity** | Low      | Medium               | Medium                  |
    | **Additional Dependencies**   | None     | `avro-js` module     | `protobufjs` module     |

Choose the serialization format that best fits your needs:

* **JSON**: Best for simplicity and when schema flexibility is important
* **Avro**: Best for systems with evolving schemas and when compatibility is critical
* **Protocol Buffers**: Best for performance-critical systems with structured data

## Advanced

### Accessing record metadata

Each Kafka record contains important metadata that you can access alongside the deserialized message content. This metadata helps with message processing, troubleshooting, and implementing advanced patterns like exactly-once processing.

=== "Working with Record Metadata"

    ```typescript hl_lines="10"
    --8<-- "examples/snippets/kafka/advancedWorkingWithRecordMetadata.ts"
    ```

For debugging purposes, you can also access the original key, value, and headers in their base64-encoded form, these are available in the `originalValue`, `originalKey`, and `originalHeaders` properties of the `record`.

#### Available metadata properties

| Property              | Description                                                      | Example Use Case                                                    |
|-----------------------|------------------------------------------------------------------|---------------------------------------------------------------------|
| `topic`               | Topic name the record was published to                           | Routing logic in multi-topic consumers                              |
| `partition`           | Kafka partition number                                           | Tracking message distribution                                       |
| `offset`              | Position in the partition                                        | De-duplication, exactly-once processing                             |
| `timestamp`           | Unix timestamp when record was created                           | Event timing analysis                                               |
| `timestamp_type`      | Timestamp type (`CREATE_TIME` or `LOG_APPEND_TIME`)              | Data lineage verification                                           |
| `headers`             | Key-value pairs attached to the message                          | Cross-cutting concerns like correlation IDs                         |
| `key`                 | Deserialized message key                                         | Customer ID or entity identifier                                    |
| `value`               | Deserialized message content                                     | The actual business data                                            |
| `originalValue`       | Base64-encoded original message value                            | Debugging or custom deserialization                                 |
| `originalKey`         | Base64-encoded original message key                              | Debugging or custom deserialization                                 |
| `originalHeaders`     | Base64-encoded original message headers                          | Debugging or custom deserialization                                 |
| `valueSchemaMetadata` | Metadata about the value schema like `schemaId` and `dataFormat` | Used by `kafkaConsumer` to process Protobuf, data format validation |
| `keySchemaMetadata`   | Metadata about the key schema like `schemaId` and `dataFormat`   | Used by `kafkaConsumer` to process Protobuf, data format validation |

### Additional Parsing

You can parse deserialized data using your preferred parsing library. This can help you integrate Kafka data with your domain schemas and application architecture, providing type hints, runtime parsing and validation, and advanced data transformations.

=== "Zod"

    ```typescript hl_lines="25 29"
    --8<-- "examples/snippets/kafka/advancedWorkingWithZod.ts"
    ```

=== "Valibot"

    ```typescript hl_lines="28 32"
    --8<-- "examples/snippets/kafka/advancedWorkingWithValibot.ts"
    ```

=== "ArkType"

    ```typescript hl_lines="25 29"
    --8<-- "examples/snippets/kafka/advancedWorkingWithArkType.ts"
    ```

### Error handling

Handle errors gracefully when processing Kafka messages to ensure your application maintains resilience and provides clear diagnostic information. The Kafka consumer utility provides specific exception types to help you identify and handle deserialization issues effectively.

!!! tip
    Fields like `value`, `key`, and `headers` are decoded lazily, meaning they are only deserialized when accessed. This allows you to handle deserialization errors at the point of access rather than when the record is first processed.

=== "Basic Error Handling"

    ```typescript hl_lines="29 36 45"
    --8<-- "examples/snippets/kafka/advancedBasicErrorHandling.ts:3"
    ```

    1. If you want to handle deserialization and parsing errors, you should destructure or access the `value`, `key`, or `headers` properties of the record within the `for...of` loop.

=== "Parser Error Handling"

    ```typescript hl_lines="41 44"
    --8<-- "examples/snippets/kafka/advancedParserErrorHandling.ts:3"
    ```

    1. The `cause` property of the error is populated with the original Standard Schema parsing error, allowing you to access detailed information about the parsing failure.

#### Error types

| Exception                            | Description                                   | Common Causes                                                               |
|--------------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------|
| `KafkaConsumerError`.                | Base class for all Kafka consumer errors      | General unhandled errors                                                    |
| `KafkaConsumerDeserializationError`  | Thrown when message deserialization fails     | Corrupted message data, schema mismatch, or wrong schema type configuration |
| `KafkaConsumerMissingSchemaError`    | Thrown when a required schema is not provided | Missing schema for AVRO or PROTOBUF formats (required parameter)            |
| `KafkaConsumerOutputSerializerError` | Thrown when additional schema parsing fails   | Parsing failures in Standard Schema models                                  |

### Integrating with Idempotency

When processing Kafka messages in Lambda, failed batches can result in message reprocessing. The [Idempotency utility](./idempotency.md) prevents duplicate processing by tracking which messages have already been handled, ensuring each message is processed exactly once.

The Idempotency utility automatically stores the result of each successful operation, returning the cached result if the same message is processed again, which prevents potentially harmful duplicate operations like double-charging customers or double-counting metrics.

!!! tip
    By using the Kafka record's unique coordinates (topic, partition, offset) as the idempotency key, you ensure that even if a batch fails and Lambda retries the messages, each message will be processed exactly once.

=== "Idempotent Kafka Processing"

    ```typescript hl_lines="44 51"
    --8<-- "examples/snippets/kafka/advancedWorkingWithIdempotency.ts"
    ```

### Best practices

#### Handling large messages

When processing large Kafka messages in Lambda, be mindful of memory limitations. Although the Kafka consumer utility optimizes memory usage, large deserialized messages can still exhaust the function resources.

=== "Handling Large Messages"

    ```typescript hl_lines="18-20"
    --8<-- "examples/snippets/kafka/advancedHandlingLargeMessages.ts:6"
    ```

For large messages, consider these proven approaches:

* **Store the data:** use Amazon S3 and include only the S3 reference in your Kafka message
* **Split large payloads:** use multiple smaller messages with sequence identifiers
* **Increase memory:** Increase your Lambda function's memory allocation, which also increases CPU capacity

#### Batch size configuration

The number of Kafka records processed per Lambda invocation is controlled by your Event Source Mapping configuration. Properly sized batches optimize cost and performance.

=== "Handling Large Messages"

    ```yaml hl_lines="16"
    --8<-- "examples/snippets/kafka/templates/advancedBatchSizeConfiguration.yaml"
    ```

Different workloads benefit from different batch configurations:

* **High-volume, simple processing:** Use larger batches (100-500 records) with short timeout
* **Complex processing with database operations:** Use smaller batches (10-50 records)
* **Mixed message sizes:** Set appropriate batching window (1-5 seconds) to handle variability

#### Cross-language compatibility

When using binary serialization formats across multiple programming languages, ensure consistent schema handling to prevent deserialization failures.

Common cross-language challenges to address:

* **Field naming conventions:** camelCase in Java vs snake_case in Python
* **Date/time:** representation differences
* **Numeric precision handling:** especially decimals, doubles, and floats

### Troubleshooting

#### Deserialization failures

When encountering deserialization errors with your Kafka messages, follow this systematic troubleshooting approach to identify and resolve the root cause.

First, check that your schema definition exactly matches the message format. Even minor discrepancies can cause deserialization failures, especially with binary formats like Avro and Protocol Buffers.

For binary messages that fail to deserialize, examine the raw encoded data:

```javascript
// DO NOT include this code in production handlers
// For troubleshooting purposes only
import base64

const rawBytes = Buffer.from(record.originalValue, 'base64');
console.log(`Message size: ${rawBytes.length} bytes`);
console.log(`First 50 bytes (hex): ${rawBytes.slice(0, 50).toString('hex')}`);
```

#### Schema compatibility issues

Schema compatibility issues often manifest as successful connections but failed deserialization. Common causes include:

* **Schema evolution without backward compatibility**: New producer schema is incompatible with consumer schema
* **Field type mismatches**: For example, a field changed from string to integer across systems
* **Missing required fields**: Fields required by the consumer schema but absent in the message
* **Default value discrepancies**: Different handling of default values between languages

When using Schema Registry, verify schema compatibility rules are properly configured for your topics and that all applications use the same registry.

#### Memory and timeout optimization

Lambda functions processing Kafka messages may encounter resource constraints, particularly with large batches or complex processing logic.

For memory errors:

* Increase Lambda memory allocation, which also provides more CPU resources
* Process fewer records per batch by adjusting the `BatchSize` parameter in your event source mapping
* Consider optimizing your message format to reduce memory footprint

For timeout issues:

* Extend your Lambda function timeout setting to accommodate processing time
* Implement chunked or asynchronous processing patterns for time-consuming operations
* Monitor and optimize database operations, external API calls, or other I/O operations in your handler

!!! tip "Monitoring memory usage"
    Use CloudWatch metrics to track your function's memory utilization. If it consistently exceeds 80% of allocated memory, consider increasing the memory allocation or optimizing your code.

## Kafka consumer workflow

### Using ESM with Schema Registry validation (SOURCE)

<center>
```mermaid
--8<-- "examples/snippets/kafka/diagrams/usingESMWithSchemaRegistry.mermaid"
```
</center>

### Using ESM with Schema Registry deserialization (JSON)

<center>
```mermaid
--8<-- "examples/snippets/kafka/diagrams/usingESMWithJsonSchemaRegistry.mermaid"
```
</center>

### Using ESM without Schema Registry integration

<center>
```mermaid
--8<-- "examples/snippets/kafka/diagrams/usingESMWithoutSchemaRegistry.mermaid"
```
</center>

## Testing your code

Testing Kafka consumer code requires simulating Lambda events with Kafka messages. You can create simple test cases using local JSON files without needing a live Kafka cluster. Below an example of how to simulate a JSON message.

=== "Testing your code"

    ```typescript
    --8<-- "examples/snippets/kafka/advancedTestingYourCode.ts"
    ```
