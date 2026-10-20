import { KafkaConsumerDeserializationError } from '../errors.js';
import type {
  ProtobufDeserializer,
  ProtobufMessage,
  SchemaMetadata,
} from '../types/types.js';

let deserializer: ProtobufDeserializer | undefined;

/**
 * Create a Protobuf deserializer, importing `protobufjs` on first use.
 *
 * The `protobufjs` dependency is only required when deserializing Protobuf
 * messages, so it's resolved at runtime through a non-literal specifier. This
 * keeps bundlers (e.g. esbuild) from eagerly including `protobufjs` - and
 * failing when it isn't installed - in builds that never use Protobuf. See
 * {@link https://www.npmjs.com/package/protobufjs | `protobufjs`}.
 */
const createDeserializer = async (): Promise<ProtobufDeserializer> => {
  if (deserializer !== undefined) {
    return deserializer;
  }

  const moduleName = 'protobufjs';
  const { BufferReader }: typeof import('protobufjs') = await import(
    moduleName
  );

  /**
   * Default order of varint types used in Protobuf to attempt deserializing Confluent Schema Registry messages.
   */
  const varintOrder: Array<'int32' | 'sint32'> = ['int32', 'sint32'];

  /**
   * Clip the Confluent Schema Registry buffer to remove the index bytes.
   *
   * @param buffer - The buffer to clip.
   * @param intType - The type of the integer to read from the buffer, either 'int32' or 'sint32'.
   */
  const clipConfluentSchemaRegistryBuffer = (
    buffer: Buffer,
    intType: 'int32' | 'sint32'
  ) => {
    const reader = new BufferReader(buffer);
    /**
     * Read the first varint byte to get the index count or 0.
     * Doing so, also advances the reader position to the next byte after the index count.
     */
    const indexCount = intType === 'int32' ? reader.int32() : reader.sint32();
    // Skip the index bytes
    reader.skip(indexCount);
    return reader;
  };

  /**
   * Deserialize a Protobuf message from a base64-encoded string.
   *
   * @template T - The type of the deserialized message object.
   *
   * @param data - The base64-encoded string representing the Protobuf binary data.
   * @param messageType - The Protobuf message type definition - see the `Message` type from {@link https://www.npmjs.com/package/protobufjs | `protobufjs`}.
   */
  deserializer = <T>(
    data: string,
    messageType: ProtobufMessage<T>,
    schemaMetadata: SchemaMetadata
  ): T => {
    const buffer = Buffer.from(data, 'base64');
    try {
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
        const reader = new BufferReader(buffer);
        reader.uint32();
        return messageType.decode(reader);
      }
    } catch (error) {
      throw new KafkaConsumerDeserializationError(
        `Failed to deserialize Protobuf message: ${error}, message: ${data}, messageType: ${JSON.stringify(messageType)}`
      );
    }

    /**
     * If schemaId is numeric, inferred from its length, we know it's coming from Confluent Schema Registry,
     * so we need to remove the MessageIndex bytes.
     * We don't know the type of the index, so we try both `int32` and `sint32`. If both fail, we throw an error.
     */
    try {
      const newBuffer = clipConfluentSchemaRegistryBuffer(
        buffer,
        varintOrder[0]
      );
      return messageType.decode(newBuffer);
    } catch (error) {
      try {
        const newBuffer = clipConfluentSchemaRegistryBuffer(
          buffer,
          varintOrder[1]
        );
        const decoded = messageType.decode(newBuffer);
        // swap varint order if the first attempt failed so we can use the correct one for subsequent messages
        varintOrder.reverse();
        return decoded;
      } catch {
        throw new KafkaConsumerDeserializationError(
          `Failed to deserialize Protobuf message: ${error}, message: ${data}, messageType: ${JSON.stringify(messageType)}`
        );
      }
    }
  };

  return deserializer;
};

export { createDeserializer };
