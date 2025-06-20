import type { AsyncHandler } from '@aws-lambda-powertools/commons/types';
import { isNull, isRecord } from '@aws-lambda-powertools/commons/typeutils';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Context, Handler } from 'aws-lambda';
import { deserialize as deserializeJson } from './deserializer/json.js';
import { deserialize as deserializePrimitive } from './deserializer/primitive.js';
import {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerDeserializationError,
  KafkaConsumerError,
  KafkaConsumerParserError,
  KafkaConsumerProtobufMissingSchemaError,
} from './errors.js';
import type {
  ConsumerRecord,
  ConsumerRecords,
  DeserializeOptions,
  Deserializer,
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
    throw new KafkaConsumerError(
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
const deserialize = ({
  value,
  deserializer,
  config,
  schemaMetadata,
}: DeserializeOptions) => {
  if (config === undefined) {
    return deserializer(value);
  }
  if (config.type === 'json') {
    return deserializer(value);
  }

  if (config.type === 'avro') {
    if (!config.schema) {
      throw new KafkaConsumerAvroMissingSchemaError(
        'Schema string is required for avro deserialization'
      );
    }
    return deserializer(value, config.schema);
  }
  if (config.type === 'protobuf') {
    if (!config.schema) {
      throw new KafkaConsumerProtobufMissingSchemaError(
        'Schema string is required for protobuf deserialization'
      );
    }
    return deserializer(value, config.schema, schemaMetadata);
  }
};

/**
 * Get the deserializer function based on the provided type.
 *
 * @param type - The type of deserializer to use. Supported types are: `json`, `avro`, `protobuf`, or `undefined`.
 *   If `undefined`, it defaults to deserializing as a primitive string.
 */
const getDeserializer = async (type?: string) => {
  if (!type) {
    return deserializePrimitive as Deserializer;
  }
  if (type === 'json') {
    return deserializeJson as Deserializer;
  }
  if (type === 'protobuf') {
    const deserializer = await import('./deserializer/protobuf.js');
    return deserializer.deserialize as Deserializer;
  }
  if (type === 'avro') {
    const deserializer = await import('./deserializer/avro.js');
    return deserializer.deserialize as Deserializer;
  }
  throw new KafkaConsumerDeserializationError(
    `Unsupported deserialization type: ${type}. Supported types are: json, avro, protobuf.`
  );
};

/**
 * Parse a value against a provided schema using the `~standard` property for validation.
 *
 * @param value - The value to parse against the schema.
 * @param schema - The schema to validate against, which should be a {@link StandardSchemaV1 | `Standard Schema V1`} object.
 */
const parseSchema = (value: unknown, schema: StandardSchemaV1) => {
  const result = schema['~standard'].validate(value);
  /* v8 ignore start */
  if (result instanceof Promise)
    throw new KafkaConsumerParserError(
      'Schema parsing supports only synchronous validation'
    );
  /* v8 ignore stop */
  if (result.issues) {
    throw new KafkaConsumerParserError('Schema validation failed', {
      cause: result.issues,
    });
  }
  return result.value;
};

/**
 * Deserialize a single record from an MSK event.
 *
 * @param record - A single record from the MSK event.
 * @param config - The schema configuration for deserializing the record's key and value.
 */
const deserializeRecord = async (
  record: KafkaRecord,
  config?: SchemaConfig
) => {
  const {
    key,
    value,
    headers,
    valueSchemaMetadata,
    keySchemaMetadata,
    ...rest
  } = record;
  const { key: keyConfig, value: valueConfig } = config || {};

  const deserializerKey = await getDeserializer(keyConfig?.type);
  const deserializerValue = await getDeserializer(valueConfig?.type);

  return {
    ...rest,
    get key() {
      if (key === undefined || key === '') {
        return undefined;
      }
      if (isNull(key)) return null;
      const deserializedKey = deserialize({
        value: key,
        deserializer: deserializerKey,
        config: keyConfig,
        schemaMetadata: keySchemaMetadata,
      });

      return keyConfig?.parserSchema
        ? parseSchema(deserializedKey, keyConfig.parserSchema)
        : deserializedKey;
    },
    originalKey: key,
    get value() {
      const deserializedValue = deserialize({
        value: value,
        deserializer: deserializerValue,
        config: valueConfig,
        schemaMetadata: valueSchemaMetadata,
      });

      return valueConfig?.parserSchema
        ? parseSchema(deserializedValue, valueConfig.parserSchema)
        : deserializedValue;
    },
    originalValue: value,
    get headers() {
      return deserializeHeaders(headers);
    },
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
  config?: SchemaConfig
): ((event: MSKEvent, context: Context) => Promise<unknown>) => {
  return async (event: MSKEvent, context: Context): Promise<unknown> => {
    assertIsMSKEvent(event);

    const consumerRecords: ConsumerRecord<K, V>[] = [];
    for (const recordsArray of Object.values(event.records)) {
      for (const record of recordsArray) {
        consumerRecords.push(
          (await deserializeRecord(
            record,
            config
          )) as unknown as ConsumerRecord<K, V>
        );
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
