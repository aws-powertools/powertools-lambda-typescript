import {
  BinaryReader,
  type MessageType,
  binaryReadOptions,
} from '@protobuf-ts/runtime';
import { KafkaConsumerDeserializationError } from './errors.js';

const avro = require('avro-js');

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

const deserialiseProtobuf = <T extends object>(
  messageType: MessageType<T>,
  data: string
): T => {
  try {
    const buffer = Buffer.from(data, 'base64');

    return messageType.internalBinaryRead(
      new BinaryReader(buffer),
      buffer.length,
      binaryReadOptions()
    );
  } catch (error) {
    throw new KafkaConsumerDeserializationError(
      `Failed to deserialize Protobuf message: ${error}, message: ${data}, messageType: ${messageType.typeName}`
    );
  }
};

const deserialiseAvro = (message: string, schemaStr: string) => {
  try {
    const type = avro.parse(schemaStr);
    const buffer = Buffer.from(message, 'base64');
    return type.fromBuffer(buffer);
  } catch (error) {
    throw new KafkaConsumerDeserializationError(
      `Failed to deserialize Avro message: ${error}, message: ${message}, schema: ${schemaStr}`
    );
  }
};

export { deserialiseAvro, deserialiseHeaders, deserialiseProtobuf };
