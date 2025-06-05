import type { Context, Handler } from 'aws-lambda';
import { parse } from 'protobufjs';
import type {
  AnyFunction,
  ConsumerRecords,
  MSKEvent,
  SchemaConfig,
  SchemaConfigValue,
} from './types.js';
const avro = require('avro-js');

const deserialise = (value: string, config: SchemaConfigValue) => {
  const { type, schemaStr, outputObject } = config;
  const decoded = Buffer.from(value, 'base64');
  if (type === 'json') {
    try {
      // we assume it's a JSON but it can also be a string, we don't know
      return JSON.parse(decoded.toString());
    } catch (error) {
      // in case we could not parse it we return the base64 decoded value
      return decoded.toString();
    }
  }
  if (type === 'avro') {
    const type = avro.parse(config.schemaStr);
    return type.fromBuffer(decoded);
  }
  // TODO: Add support for protobuf.
  if (type === 'protobuf') {
    if (schemaStr) {
      return deserialiseProtobuf(schemaStr, outputObject as string, value);
    }
  }
};

const deserialiseProtobuf = (
  schemaStr: string,
  messageName: string,
  base64Data: string
): Record<string, unknown> => {
  const root = parse(schemaStr).root;
  const Message = root.lookupType(messageName);

  const buffer = Buffer.from(base64Data, 'base64');
  const decodedMessage = Message.decode(buffer);

  return Message.toObject(decodedMessage, {
    longs: Number,
    enums: String,
    defaults: true,
    arrays: true,
    objects: true,
  });
};

const deserialiseHeaders = (headers: Record<string, number[]>[]) => {
  return headers.map((header) =>
    Object.fromEntries(
      Object.entries(header).map(([headerKey, headerValue]) => [
        headerKey,
        Buffer.from(headerValue).toString('utf-8'),
      ])
    )
  );
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
