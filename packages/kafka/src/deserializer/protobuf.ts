import { KafkaConsumerDeserializationError } from '../errors.js';
import type { ProtobufMessage } from '../types/types.js';

/**
 * Deserialises a Protobuf message from a base64-encoded string.
 *
 * @template T - The type of the deserialised message object.
 * @param MessageClass - The Protobuf message type definition.
 *   See {@link MessageType} from '@protobuf-ts/runtime'.
 * @param data - The base64-encoded string representing the Protobuf binary data.
 * @returns The deserialised message object of type T.
 * @throws {KafkaConsumerDeserializationError} If deserialization fails.
 */
export const deserialize = <T>(
  data: string,
  messageType: ProtobufMessage<T>
): T => {
  try {
    const buffer = Buffer.from(data, 'base64');
    return messageType.decode(buffer, buffer.length);
  } catch (error) {
    throw new KafkaConsumerDeserializationError(
      `Failed to deserialize Protobuf message: ${error}, message: ${data}, messageType: ${messageType}`
    );
  }
};
