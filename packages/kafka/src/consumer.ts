import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
import type { Context, Handler } from 'aws-lambda';
import type {
  AnyFunction,
  ConsumerRecords,
  KafkaEvent,
  SchemaConfig,
  SchemaConfigValue,
} from './types.js';
const avro = require('avro-js');

const deserialise = (value: string, config: SchemaConfigValue) => {
  if (config.type === 'json') {
    const decoded = Buffer.from(value, 'base64').toString();
    try {
      return JSON.parse(decoded);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return decoded;
      }
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }
  if (config.type === 'avro') {
    const type = avro.parse(config.schemaStr);
    const decoded = fromBase64(value);
    return type.fromBuffer(decoded);
  }
  if (config.type === 'protobuf') {
    // TODO: Add support for protobuf.
  }
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
    return fn.call(this, consumerRecords, context, ...args);
  };
}
