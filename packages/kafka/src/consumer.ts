import type { Context, Handler } from 'aws-lambda';
import {
  deserialiseAvro,
  deserialiseHeaders,
  deserialiseProtobuf,
} from './deserialiser.js';
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

const deserialise = (value: string, config?: SchemaType) => {
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
          key: record.key ? deserialise(record.key, config.key) : undefined,
          value: deserialise(record.value, config.value),
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
