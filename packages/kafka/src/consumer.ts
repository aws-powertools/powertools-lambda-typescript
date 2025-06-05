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
  ConsumerRecords,
  MSKEvent,
  SchemaConfig,
  SchemaConfigValue,
} from './types.js';

const deserialise = (value: string, config: SchemaConfigValue) => {
  const { type, schemaStr, outputObject } = config;
  if (type === 'json') {
    const decoded = Buffer.from(value, 'base64');
    try {
      // we assume it's a JSON but it can also be a string, we don't know
      return JSON.parse(decoded.toString());
    } catch (error) {
      // in case we could not parse it we return the base64 decoded value
      return decoded.toString();
    }
  }
  if (type === 'avro') {
    if (!schemaStr) {
      throw new KafkaConsumerAvroMissingSchemaError(
        'Schema string is required for Avro deserialization'
      );
    }
    return deserialiseAvro(value, schemaStr);
  }
  if (type === 'protobuf') {
    if (!schemaStr) {
      throw new KafkaConsumerProtobufMissingSchemaError(
        'Schema string is required for Protobuf deserialization'
      );
    }
    return deserialiseProtobuf(schemaStr, outputObject as string, value);
  }

  throw new Error(`Unsupported deserialization type: ${type}`);
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
    const consumerRecords: ConsumerRecords<K, V>[] = [];
    for (const [_topicPartition, recordsArray] of Object.entries(
      event.records
    )) {
      for (const record of recordsArray) {
        consumerRecords.push({
          key:
            record.key && config.key
              ? deserialise(record.key, config.key)
              : undefined,
          value: deserialise(record.value, config.value),
          originalKey: record.key,
          originalValue: record.value,
          headers: deserialiseHeaders(record.headers),
          originalHeaders: record.headers,
        });
      }
    }

    // Call the original function with the validated event and context
    return await fn.call(this, consumerRecords, context, ...args);
  };
}
