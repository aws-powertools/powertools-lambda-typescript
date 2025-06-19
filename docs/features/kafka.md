---
title: Kafka Consumer
description: Utility
status: new
---

???+ info "Work in progress"
    This documentation page is a work in progress for an upcoming feature in Powertools for AWS Lambda. If you're seeing this page, it means the release process is underway, but the feature is not yet available on npm. Please check back soon for the final version.

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

### Required resources

To use the Kafka consumer utility, you need an AWS Lambda function configured with a Kafka event source. This can be Amazon MSK, MSK Serverless, or a self-hosted Kafka cluster.

=== "gettingStartedWithMsk.yaml"

    ```yaml
    --8<-- "examples/snippets/kafka/templates/gettingStartedWithMsk.yaml"
    ```

### Using ESM with Schema Registry

The Event Source Mapping configuration determines which mode is used. With `JSON`, Lambda converts all messages to JSON before invoking your function. With `SOURCE` mode, Lambda preserves the original format, requiring you function to handle the appropriate deserialization.

Powertools for AWS supports both Schema Registry integration modes in your Event Source Mapping configuration.

### Processing Kafka events

The Kafka consumer utility transforms raw Kafka events into an intuitive format for processing. To handle messages effectively, you'll need to configure a schema that matches your data format.

???+ tip "Using Avro is recommended"
    We recommend Avro for production Kafka implementations due to its schema evolution capabilities, compact binary format, and integration with Schema Registry. This offers better type safety and forward/backward compatibility compared to JSON.

=== "Avro Messages"

    ```typescript
    --8<-- "examples/snippets/kafka/gettingStartedAvro.ts"
    ```

=== "Protocol Buffers"

    ```typescript
    --8<-- "examples/snippets/kafka/gettingStartedProtobuf.ts"
    ```
    
=== "JSON Messages"

    ```typescript
    --8<-- "examples/snippets/kafka/gettingStartedJson.ts"
    ```

### Deserializing keys and values

The `kafkaConsumer` function can deserialize both keys and values independently based on your schema configuration. This flexibility allows you to work with different data formats in the same message.

=== "index.ts"

    ```typescript
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

    ```typescript
    --8<-- "examples/snippets/kafka/advancedWorkingWithRecordMetadata.ts"
    ```

For debugging purposes, you can also access the original key, value, and headers in their base64-encoded form, these are available in the `originalValue`, `originalKey`, and `originalHeaders` properties of the `record`.

#### Available metadata properties

| Property          | Description                                         | Example Use Case                            |
|-------------------|-----------------------------------------------------|---------------------------------------------|
| `topic`           | Topic name the record was published to              | Routing logic in multi-topic consumers      |
| `partition`       | Kafka partition number                              | Tracking message distribution               |
| `offset`          | Position in the partition                           | De-duplication, exactly-once processing     |
| `timestamp`       | Unix timestamp when record was created              | Event timing analysis                       |
| `timestamp_type`  | Timestamp type (`CREATE_TIME` or `LOG_APPEND_TIME`) | Data lineage verification                   |
| `headers`         | Key-value pairs attached to the message             | Cross-cutting concerns like correlation IDs |
| `key`             | Deserialized message key                            | Customer ID or entity identifier            |
| `value`           | Deserialized message content                        | The actual business data                    |
| `originalValue`   | Base64-encoded original message value               | Debugging or custom deserialization         |
| `originalKey`     | Base64-encoded original message key                 | Debugging or custom deserialization         |
| `originalHeaders` | Base64-encoded original message headers             | Debugging or custom deserialization         |

### Custom output serializers

You can parse deserialized data using your preferred parsing library. This can help you integrate Kafka data with your domain schemas and application architecture, providing type hints, runtime parsing and validation, and advanced data transformations.

=== "Zod"

    ```typescript
    --8<-- "examples/snippets/kafka/advancedWorkingWithZod.ts"
    ```

=== "Valibot"

    ```typescript
    --8<-- "examples/snippets/kafka/advancedWorkingWithValibot.ts"
    ```

=== "ArkType"

    ```typescript
    --8<-- "examples/snippets/kafka/advancedWorkingWithArkType.ts"
    ```

#### Exception types

| Exception | Description | Common Causes |
|-----------|-------------|---------------|
| `KafkaConsumerDeserializationError` | Raised when message deserialization fails | Corrupted message data, schema mismatch, or wrong schema type configuration |
| `KafkaConsumerAvroSchemaParserError` | Raised when parsing Avro schema definition fails | Syntax errors in schema JSON, invalid field types, or malformed schema |
| `KafkaConsumerMissingSchemaError` | Raised when a required schema is not provided | Missing schema for AVRO or PROTOBUF formats (required parameter) |
| `KafkaConsumerOutputSerializerError` | Raised when output serializer fails | Error in custom serializer function, incompatible data, or validation failures in Pydantic models |

### Integrating with Idempotency

When processing Kafka messages in Lambda, failed batches can result in message reprocessing. The idempotency utility prevents duplicate processing by tracking which messages have already been handled, ensuring each message is processed exactly once.

The Idempotency utility automatically stores the result of each successful operation, returning the cached result if the same message is processed again, which prevents potentially harmful duplicate operations like double-charging customers or double-counting metrics.

=== "Idempotent Kafka Processing"

    ```typescript
    --8<-- "examples/snippets/kafka/advancedWorkingWithIdempotency.ts"
    ```

TIP: By using the Kafka record's unique coordinates (topic, partition, offset) as the idempotency key, you ensure that even if a batch fails and Lambda retries the messages, each message will be processed exactly once.

### Troubleshooting

#### Deserialization failures

When encountering deserialization errors with your Kafka messages, follow this systematic troubleshooting approach to identify and resolve the root cause.

First, check that your schema definition exactly matches the message format. Even minor discrepancies can cause deserialization failures, especially with binary formats like Avro and Protocol Buffers.

For binary messages that fail to deserialize, examine the raw encoded data:

```python
# DO NOT include this code in production handlers
# For troubleshooting purposes only
import base64

raw_bytes = base64.b64decode(record.raw_value)
print(f"Message size: {len(raw_bytes)} bytes")
print(f"First 50 bytes (hex): {raw_bytes[:50].hex()}")
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

???+ tip "Monitoring memory usage"
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

TBD
