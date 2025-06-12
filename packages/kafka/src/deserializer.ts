import {
  BinaryReader,
  type MessageType,
  binaryReadOptions,
} from '@protobuf-ts/runtime';
import { KafkaConsumerDeserializationError } from './errors.js';

const avro = require('avro-js');

/**
 * Deserialises Kafka message headers from an array of header objects.
 *
 * @param headers - An array of header objects, where each object maps header keys (string)
 *   to header values (number[]), representing the raw bytes of each header value.
 *   Example: [{ "headerKey": [104, 101, 108, 108, 111] }]
 * @returns An array of header objects, where each header value is decoded as a UTF-8 string.
 *   Example: [{ "headerKey": "hello" }]
 */
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

/**
 * Deserialises a Protobuf message from a base64-encoded string.
 *
 * @template T - The type of the deserialised message object.
 * @param messageType - The Protobuf message type definition.
 *   See {@link MessageType} from '@protobuf-ts/runtime'.
 * @param data - The base64-encoded string representing the Protobuf binary data.
 * @returns The deserialised message object of type T.
 * @throws {KafkaConsumerDeserializationError} If deserialization fails.
 */
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

/**
 * Deserialises an Avro message from a base64-encoded string using the provided Avro schema.
 *
 * @param message - The base64-encoded string representing the Avro binary data.
 * @param schemaStr - The Avro schema as a JSON string.
 * @returns The deserialised Avro message as a JavaScript object.
 * @throws {KafkaConsumerDeserializationError} If deserialization fails.
 */
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
