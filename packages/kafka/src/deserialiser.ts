import { parse } from 'protobufjs';
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

const deserialiseProtobuf = (
  schemaStr: string,
  messageName: string,
  data: string
): Record<string, unknown> => {
  try {
    const root = parse(schemaStr).root;
    const Message = root.lookupType(messageName);

    const buffer = Buffer.from(data, 'base64');
    const decodedMessage = Message.decode(buffer);

    return Message.toObject(decodedMessage, {
      longs: Number,
      enums: String,
      defaults: true,
      arrays: true,
      objects: true,
    });
  } catch (error) {
    throw new KafkaConsumerDeserializationError(
      `Failed to deserialize Protobuf message: ${error}, message: ${data}, schema: ${schemaStr}`
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
