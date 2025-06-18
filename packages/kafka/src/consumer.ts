import type { Context, Handler } from 'aws-lambda';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerParserError,
  KafkaConsumerProtobufMissingSchemaError,
} from './errors.js';
import type {
  ConsumerRecord,
  LambdaHandler,
  MSKEvent,
  SchemaConfig,
  SchemaType,
} from './types.js';

/**
 * Deserialises Kafka message headers from an array of header objects.
 *
 * @param headers - An array of header objects, where each object maps header keys (string)
 *   to header values (number[]), representing the raw bytes of each header value.
 *   Example: [{ "headerKey": [104, 101, 108, 108, 111] }]
 * @returns An array of header objects, where each header value is decoded as a UTF-8 string.
 *   Example: [{ "headerKey": "hello" }]
 */
const deserialiseHeaders = (headers: Record<string, number[]>[]) => {
  const result = [];
  for (const header of headers) {
    const entries = [];
    for (const [headerKey, headerValue] of Object.entries(header)) {
      entries.push([headerKey, Buffer.from(headerValue).toString('utf-8')]);
    }
    result.push(Object.fromEntries(entries));
  }
  return result;
};

/**
 * Deserializes a base64-encoded value using the provided schema configuration.
 *
 * @param value - The base64-encoded string to deserialize.
 * @param config - The schema configuration to use for deserialization. See {@link SchemaType}.
 *   If not provided, the value is decoded as a UTF-8 string.
 * @returns The deserialized value, which may be a string, object, or other type depending on the schema.
 */
const deserialize = async (value: string, config?: SchemaType) => {
  // no config -> default to base64 decoding
  if (config === undefined) {
    return Buffer.from(value, 'base64').toString();
  }

  // if config is provided, we expect it to have a specific type
  if (!['json', 'avro', 'protobuf'].includes(config.type)) {
    throw new Error(
      `Unsupported deserialization type: ${config.type}. Supported types are: json, avro, protobuf.`
    );
  }

  if (config.type === 'json') {
    const deserializer = await import('./deserializer/json.js');
    return deserializer.deserialize(value);
  }

  if (config.type === 'avro') {
    if (!config.schema) {
      throw new KafkaConsumerAvroMissingSchemaError(
        'Schema string is required for Avro deserialization'
      );
    }
    const deserializer = await import('./deserializer/avro.js');
    return deserializer.deserialize(value, config.schema);
  }
  if (config.type === 'protobuf') {
    if (!config.schema) {
      throw new KafkaConsumerProtobufMissingSchemaError(
        'Schema string is required for Protobuf deserialization'
      );
    }
    const deserializer = await import('./deserializer/protobuf.js');
    return deserializer.deserialize(value, config.schema);
  }
};

/**
 * Wraps a handler function to automatically deserialize and validate Kafka records from an MSK event.
 *
 * The returned function will:
 * - Deserialize the key and value of each record using the provided schema config.
 * - Validate the deserialized key and value using Zod schemas if provided.
 * - Replace the `records` property in the event with an array of deserialized and validated records.
 * - Call the original handler with the modified event and original context/arguments.
 *
 * @typeParam K - The type of the deserialized key.
 * @typeParam V - The type of the deserialized value.
 * @param handler - The original handler function to wrap. It should accept the deserialized event as its first argument.
 * @param config - The schema configuration for deserializing and validating record keys and values.
 * @returns A new handler function that performs deserialization and validation before invoking the original handler.
 *
 * @example
 * ```ts
 * import { kafkaConsumer } from './consumer';
 * import { z } from 'zod';
 *
 * const config = {
 *   key: { type: 'json', zodSchema: z.string() },
 *   value: { type: 'json', zodSchema: z.object({ id: z.number() }) }
 * };
 *
 * const handler = kafkaConsumer<string, { id: number }>(async (event, context) => {
 *   // event.records is now an array of deserialized and validated records
 *   for (const record of event.records) {
 *     console.log(record.key, record.value);
 *   }
 * }, config);
 * ```
 */
export function kafkaConsumer<K, V>(
  handler: LambdaHandler,
  config: SchemaConfig
): (event: MSKEvent, context: Context) => ReturnType<LambdaHandler> {
  return async function (
    this: Handler,
    event: MSKEvent,
    context: Context
  ): Promise<ReturnType<LambdaHandler>> {
    const consumerRecords: ConsumerRecord<K, V>[] = [];
    if (!event.records) {
      throw new Error('No records found in the event');
    }
    for (const recordsArray of Object.values(event.records)) {
      for (const record of recordsArray) {
        const newRecord = {
          key: record.key
            ? await deserialize(record.key, config.key)
            : undefined,
          value: await deserialize(record.value, config.value),
          originalKey: record.key,
          originalValue: record.value,
          headers:
            record.headers !== null ? deserialiseHeaders(record.headers) : null,
          originalHeaders: record.headers,
        };

        try {
          if (config.key?.parserSchema && newRecord.key !== undefined) {
            config.key.parserSchema.parse(newRecord.key);
          }

          if (config.value.parserSchema) {
            config.value.parserSchema.parse(newRecord.value);
          }
        } catch (error) {
          if (error instanceof Error) {
            throw new KafkaConsumerParserError(
              `Schema validation failed: ${error.message}, with provided config: ${config}`
            );
          }
        }

        consumerRecords.push(newRecord);
      }
    }

    const deserialisedRecords = {
      ...event,
      records: consumerRecords,
    };

    // Call the original function with the validated event and context
    return await handler.call(this, deserialisedRecords, context);
  };
}
