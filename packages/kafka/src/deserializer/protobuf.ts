import type { Message } from 'protobufjs';
import { KafkaConsumerDeserializationError } from '../errors.js';
import type { ProtobufMessage } from '../types/types.js';

/**
 * Deserialize a Protobuf message from a base64-encoded string.
 *
 * @template T - The type of the deserialized message object.
 *
 * @param data - The base64-encoded string representing the Protobuf binary data.
 * @param messageType - The Protobuf message type definition - see {@link Message | `Message`} from {@link https://www.npmjs.com/package/protobufjs | `protobufjs`}.
 */
const deserialize = <T>(data: string, messageType: ProtobufMessage<T>): T => {
  try {
    const buffer = Buffer.from(data, 'base64');
    return messageType.decode(buffer, buffer.length);
  } catch (error) {
    throw new KafkaConsumerDeserializationError(
      `Failed to deserialize Protobuf message: ${error}, message: ${data}, messageType: ${messageType}`
    );
  }
};

export { deserialize };
