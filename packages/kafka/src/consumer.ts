import type { Context, Handler } from 'aws-lambda';
import {
  deserialiseAvro,
  deserialiseHeaders,
  deserialiseProtobuf,
} from './deserializer.js';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerProtobufMissingSchemaError,
} from './errors.js';
import type {
  AnyFunction,
  ConsumerRecord,
  MSKEvent,
  SchemaConfig,
  SchemaType,
} from './types.js';

/**
 * Deserializes a base64-encoded value using the provided schema configuration.
 *
 * @param value - The base64-encoded string to deserialize.
 * @param config - The schema configuration to use for deserialization. See {@link SchemaType}.
 *   If not provided, the value is decoded as a UTF-8 string.
 * @returns The deserialized value, which may be a string, object, or other type depending on the schema.
 */
const deserialize = (value: string, config?: SchemaType) => {
  // no config -> default to base64 decoding
  if (config === undefined) {
    return Buffer.from(value, 'base64').toString();
  }
  if (config.type === 'json') {
    const decoded = Buffer.from(value, 'base64');
    try {
      // we assume it's a JSON but it can also be a string, we don't know
      return JSON.parse(decoded.toString());
    } catch (error) {
      // in case we could not parse it we return the base64 decoded value
      console.error(`Failed to parse JSON from base64 value: ${value}`, error);
      return decoded.toString();
    }
  }
  if (config.type === 'avro') {
    if (!config.schema) {
      throw new KafkaConsumerAvroMissingSchemaError(
        'Schema string is required for Avro deserialization'
      );
    }
    return deserialiseAvro(value, config.schema);
  }
  if (config.type === 'protobuf') {
    if (!config.schema) {
      throw new KafkaConsumerProtobufMissingSchemaError(
        'Schema string is required for Protobuf deserialization'
      );
    }
    return deserialiseProtobuf(config.schema, value);
  }

  throw new Error(`Unsupported deserialization type: ${config}`);
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
 * @param fn - The original handler function to wrap. It should accept the deserialized event as its first argument.
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
  fn: AnyFunction,
  config: SchemaConfig
): (...args: Parameters<AnyFunction>) => ReturnType<AnyFunction> {
  return async function (
    this: Handler,
    ...args: Parameters<AnyFunction>
  ): Promise<ReturnType<AnyFunction>> {
    const event = args[0] as MSKEvent;

    const context = args[1] as Context;
    const consumerRecords: ConsumerRecord<K, V>[] = [];
    for (const [_topicPartition, recordsArray] of Object.entries(
      event.records
    )) {
      for (const record of recordsArray) {
        const newRecord = {
          key: record.key ? deserialize(record.key, config.key) : undefined,
          value: deserialize(record.value, config.value),
          originalKey: record.key,
          originalValue: record.value,
          headers:
            record.headers !== null ? deserialiseHeaders(record.headers) : null,
          originalHeaders: record.headers,
        };

        if (config.key?.zodSchema && newRecord.key !== undefined) {
          config.key.zodSchema.parse(newRecord.key);
        }

        if (config.value.zodSchema) {
          config.value.zodSchema.parse(newRecord.value);
        }

        consumerRecords.push(newRecord);
      }
    }

    const deserialisedRecords = {
      ...event,
      records: consumerRecords,
    };

    // Call the original function with the validated event and context
    return await fn.call(this, deserialisedRecords, context, ...args);
  };
}
