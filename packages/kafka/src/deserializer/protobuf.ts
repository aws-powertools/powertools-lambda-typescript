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
   * Skip the Confluent Schema Registry message indexes at the start of the buffer.
   *
   * Confluent writes the indexes as an array of zigzag varints: the array length
   * first, then each index. The common case `[0]` is written as a single `0` byte.
   *
   * @param buffer - The buffer to read from, positioned after the schema ID.
   */
  const skipConfluentMessageIndexes = (buffer: Buffer) => {
    const reader = new BufferReader(buffer);
    const indexCount = reader.sint32();
    for (let i = 0; i < indexCount; i++) {
      reader.sint32();
    }
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
     * so we need to remove the message index bytes before decoding.
     */
    try {
      return messageType.decode(skipConfluentMessageIndexes(buffer));
    } catch (error) {
      throw new KafkaConsumerDeserializationError(
        `Failed to deserialize Protobuf message: ${error}, message: ${data}, messageType: ${JSON.stringify(messageType)}`
      );
    }
  };

  return deserializer;
};

export { createDeserializer };
