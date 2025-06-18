import type { AsyncHandler } from '@aws-lambda-powertools/commons/types';
import { isNull, isRecord } from '@aws-lambda-powertools/commons/typeutils';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Context, Handler } from 'aws-lambda';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerParserError,
  KafkaConsumerProtobufMissingSchemaError,
} from './errors.js';
import type {
  ConsumerRecord,
  ConsumerRecords,
  Record as KafkaRecord,
  MSKEvent,
  SchemaConfig,
  SchemaConfigValue,
} from './types/types.js';

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
 * Deserialize Kafka message headers from an array of header objects.
 *
 * It returns `null` if the headers are `null`, or an array of header objects
 * where each header value is decoded as a UTF-8 string.
 *
 * @param headers - An array of header objects, where each object maps header keys (string)
 *   to header values (`number[]`), representing the raw bytes of each header value -
 *   i.e. `[{ "headerKey": [104, 101, 108, 108, 111] }]`
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
 * Deserialize a base64-encoded value using the provided schema configuration.
 *
 * It returns the deserialized value, which may be a string, object, or other type depending on the schema type.
 *
 * @param value - The base64-encoded string to deserialize.
 * @param config - The schema configuration to use for deserialization. See {@link SchemaConfigValue | `SchemaConfigValue`}.
 *   If not provided, the value is decoded as a UTF-8 string.
 */
const deserialize = async (value: string, config?: SchemaConfigValue) => {
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
 * @param config - The schema configuration for deserializing the key. See {@link SchemaConfigValue | `SchemaConfigValue`}.
 */
const deserializeKey = async (key?: string, config?: SchemaConfigValue) => {
  if (key === undefined || key === '') {
    return undefined;
  }
  if (isNull(key)) return null;
  return await deserialize(key, config);
};

const parseSchema = async (value: unknown, schema: StandardSchemaV1) => {
  let result = schema['~standard'].validate(value);
  /* v8 ignore start */
  if (result instanceof Promise) result = await result;
  /* v8 ignore stop */
  if (result.issues) {
    throw new KafkaConsumerParserError(
      `Schema validation failed ${result.issues}`
    );
  }
  return result.value;
};

/**
 * Deserialize a single record from an MSK event.
 *
 * @param record - A single record from the MSK event.
 * @param config - The schema configuration for deserializing the record's key and value.
 */
const deserializeRecord = async (record: KafkaRecord, config: SchemaConfig) => {
  const { key, value, headers, ...rest } = record;
  const { key: keyConfig, value: valueConfig } = config;

  const deserializedKey = await deserializeKey(key, keyConfig);
  const deserializedValue = await deserialize(value, valueConfig);

  return {
    ...rest,
    key: keyConfig?.parserSchema
      ? await parseSchema(deserializedKey, keyConfig.parserSchema)
      : deserializedKey,
    value: valueConfig?.parserSchema
      ? await parseSchema(deserializedValue, valueConfig.parserSchema)
      : deserializedValue,
    originalKey: key,
    originalValue: value,
    headers: deserializeHeaders(headers),
    originalHeaders: headers,
  };
};

/**
 * Wrap a handler function to automatically deserialize and validate Kafka records from an MSK event.
 *
 * The returned function will:
 * - Deserialize the key and value of each record using the provided schema config.
 * - Validate the deserialized key and value using Zod schemas if provided.
 * - Replace the `records` property in the event with an array of deserialized and validated records.
 * - Call the original handler with the modified event and original context/arguments.
 *
 * @example
 * ```ts
 * import { kafkaConsumer } from '@aws-lambda-powertools/kafka';
 * import { z } from 'zod';
 *
 * const keySchema = z.string();
 * const valueSchema = z.object({
 *   id: z.number(),
 * });
 *
 * export const handler = kafkaConsumer<z.infer<keySchema>, z.infer<valueSchema>>(async (event, context) => {
 *   // event.records is now an array of deserialized and validated records
 *   for (const record of event.records) {
 *     console.log(record.key, record.value);
 *   }
 * }, {
 *   key: { type: 'json', parserSchema: keySchema },
 *   value: { type: 'json', parserSchema: valueSchema },
 * });
 * ```
 *
 * @typeParam K - Optional type of the deserialized key - defaults to `unknown`.
 * @typeParam V - Optional type of the deserialized value - defaults to `unknown`.
 *
 * @param handler - The original handler function to wrap. It should accept the deserialized event as its first argument.
 * @param config - The schema configuration for deserializing and validating record keys and values.
 */
const kafkaConsumer = <K, V>(
  handler: AsyncHandler<Handler<ConsumerRecords<K, V>>>,
  config: SchemaConfig
): ((event: MSKEvent, context: Context) => Promise<unknown>) => {
  return async (event: MSKEvent, context: Context): Promise<unknown> => {
    assertIsMSKEvent(event);

    const consumerRecords: ConsumerRecord<K, V>[] = [];
    for (const recordsArray of Object.values(event.records)) {
      for (const record of recordsArray) {
        consumerRecords.push(await deserializeRecord(record, config));
      }
    }

    return handler(
      {
        ...event,
        records: consumerRecords,
      },
      context
    );
  };
};

export { kafkaConsumer };
