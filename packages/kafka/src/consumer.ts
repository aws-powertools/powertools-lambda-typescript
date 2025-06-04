import type { Context, Handler } from 'aws-lambda';
import type { KafkaEvent } from './schema.js';
import type {
  AnyFunction,
  ConsumerRecords,
  SchemaConfig,
  SchemaConfigValue,
} from './types.js';
const avro = require('avro-js');

const deserialise = (value: string, config: SchemaConfigValue) => {
  const decoded = Buffer.from(value, 'base64');
  if (config.type === 'json') {
    try {
      // we assume it's a JSON but it can also be a string, we don't know
      return JSON.parse(decoded.toString());
    } catch (error) {
      // in case we could not parse it we return the base64 decoded value
      return decoded.toString();
    }
  }
  if (config.type === 'avro') {
    const type = avro.parse(config.schemaStr);
    return type.fromBuffer(decoded);
  }
  // TODO: Add support for protobuf.
  // if (config.type === 'protobuf') {
  // }
};

export function kafkaConsumer<K, V>(
  fn: AnyFunction,
  config: SchemaConfig
): (...args: Parameters<AnyFunction>) => ReturnType<AnyFunction> {
  return async function (
    this: Handler,
    ...args: Parameters<AnyFunction>
  ): Promise<ReturnType<AnyFunction>> {
    const event = args[0] as KafkaEvent;

    const context = args[1] as Context;
    const consumerRecords: ConsumerRecords<K, V>[] = [];
    for (const [_topicPartition, recordsArray] of Object.entries(
      event.records
    )) {
      for (const record of recordsArray) {
        // TODO: add headers
        consumerRecords.push({
          key:
            record.key && config.key
              ? deserialise(record.key, config.key)
              : undefined,
          value: deserialise(record.value, config.value),
          originalKey: record.key,
          originalValue: record.value,
        });
      }
    }

    // Call the original function with the validated event and context
    return await fn.call(this, consumerRecords, context, ...args);
  };
}
