import {
  isNullOrUndefined,
  isRecord,
} from '@aws-lambda-powertools/commons/typeutils';
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
 * Type guard to assert that the event is a valid {@link MSKEvent | `MSKEvent`}.
 *
 * @param event - The event to validate, expected to be an MSKEvent.
 */
const assertIsMSKEvent = (event: unknown): event is MSKEvent => {
  if (
    !isRecord(event) ||
    !isRecord(event.records) ||
    !Object.values(event.records).every((arr) => Array.isArray(arr))
  ) {
    throw new Error(
      'Event is not a valid MSKEvent. Expected an object with a "records" property.'
    );
  }

  return true;
};

/**
 * Deserializes Kafka message headers from an array of header objects.
 *
 * @param headers - An array of header objects, where each object maps header keys (string)
 *   to header values (number[]), representing the raw bytes of each header value.
 *   Example: [{ "headerKey": [104, 101, 108, 108, 111] }]
 * @returns An array of header objects, where each header value is decoded as a UTF-8 string.
 *   Example: [{ "headerKey": "hello" }]
 */
const deserializeHeaders = (headers: Record<string, number[]>[] | null) => {
  if (headers === null) {
    return null;
  }
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
 * Deserialize the key of a Kafka record.
 *
 * If the key is `undefined`, it returns `undefined`.
 *
 * @param key - The base64-encoded key to deserialize.
 * @param config - The schema configuration for deserializing the key. See {@link SchemaType | `SchemaType`}.
 */
const deserializeKey = async (key?: string, config?: SchemaType) => {
  if (isNullOrUndefined(key)) {
    return undefined;
  }
  return await deserialize(key, config);
};

/**
 * Deserializes a single record from an MSK event.
 *
 * @param record - A single record from the MSK event.
 * @param config - The schema configuration for deserializing the record's key and value.
 */
const deserializeRecord = async (
  record: MSKEvent['records'][number][number],
  config: SchemaConfig
) => {
  const deserializedRecord = {
    key: await deserializeKey(record.key, config.key),
    value: await deserialize(record.value, config.value),
    originalKey: record.key,
    originalValue: record.value,
    headers: deserializeHeaders(record.headers),
    originalHeaders: record.headers,
  };

  try {
    if (config.key?.parserSchema && deserializedRecord.key !== undefined) {
      config.key.parserSchema.parse(deserializedRecord.key);
    }

    if (config.value.parserSchema) {
      config.value.parserSchema.parse(deserializedRecord.value);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new KafkaConsumerParserError(
        `Schema validation failed: ${error.message}, with provided config: ${config}`
      );
    }
  }

  return deserializedRecord;
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
function kafkaConsumer<K, V>(
  handler: LambdaHandler<K, V>,
  config: SchemaConfig
): (
  event: MSKEvent,
  context: Context
) => Promise<ReturnType<LambdaHandler<K, V>>> {
  return async function (
    this: Handler,
    event: MSKEvent,
    context: Context
  ): Promise<ReturnType<LambdaHandler<K, V>>> {
    assertIsMSKEvent(event);

    const consumerRecords: ConsumerRecord<K, V>[] = [];
    for (const recordsArray of Object.values(event.records)) {
      for (const record of recordsArray) {
        consumerRecords.push(await deserializeRecord(record, config));
      }
    }

    // Call the original function with the validated event and context
    return await handler.call(
      this,
      {
        ...event,
        records: consumerRecords,
      },
      context
    );
  };
}

export { kafkaConsumer };
