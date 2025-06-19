import { BufferReader, type Message } from 'protobufjs';
import { KafkaConsumerDeserializationError } from '../errors.js';
import type { ProtobufMessage, SchemaMetadata } from '../types/types.js';

/**
 * Deserialize a Protobuf message from a base64-encoded string.
 *
 * @template T - The type of the deserialized message object.
 *
 * @param data - The base64-encoded string representing the Protobuf binary data.
 * @param messageType - The Protobuf message type definition - see {@link Message | `Message`} from {@link https://www.npmjs.com/package/protobufjs | `protobufjs`}.
 */
const deserialize = <T>(
  data: string,
  messageType: ProtobufMessage<T>,
  schemaMetadata: SchemaMetadata
): T => {
  try {
    const buffer = Buffer.from(data, 'base64');
    if (schemaMetadata.schemaId === undefined) {
      return messageType.decode(buffer, buffer.length);
    }
    /**
     * If `schemaId` is longer than 10 chars, it's an UUID, otherwise it's a numeric ID.
     *
     * When this is the case, we know the schema is coming from Glue Schema Registry,
     * and the first byte of the buffer is a magic byte that we need to remove before
     * decoding the message.
     */
    if (schemaMetadata.schemaId.length > 10) {
      // remove the first byte from the buffer
      const newBuffer = Buffer.alloc(buffer.length - 1);
      buffer.copy(newBuffer, 0, 1);
      return messageType.decode(newBuffer, newBuffer.length);
    }
    /**
     * If schemaId is numeric, inferred from its length, we know it's coming from Confluent Schema Registry,
     * so we need to remove the MessageIndex bytes.
     */
    const reader = new BufferReader(buffer);
    /**
     * Read the first varint byte to get the index count or 0.
     * Doing so, also advances the reader position to the next byte after the index count.
     */
    let indexCount = reader.uint32();
    // Skip the index bytes
    while (indexCount > 0) {
      // Keep reading the next varint bytes until we reach the end of the index count
      reader.uint32();
      indexCount--;
    }
    // Create a new buffer without the index bytes
    const newBuffer = Buffer.alloc(buffer.length - reader.pos);
    buffer.copy(newBuffer, 0, reader.pos);
    return messageType.decode(newBuffer, newBuffer.length);
  } catch (error) {
    throw new KafkaConsumerDeserializationError(
      `Failed to deserialize Protobuf message: ${error}, message: ${data}, messageType: ${messageType}`
    );
  }
};

export { deserialize };
