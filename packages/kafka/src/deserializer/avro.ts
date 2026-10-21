import { WireFormat } from '../constants.js';
import { KafkaConsumerDeserializationError } from '../errors.js';
import type { AvroDeserializer } from '../types/types.js';

const CONFLUENT_HEADER_SIZE = 5;
const CONFLUENT_MAGIC_BYTE = 0x00;

let deserializer: AvroDeserializer | undefined;

/**
 * Strip the Confluent wire format header (magic byte and 4-byte schema ID) from an Avro payload.
 *
 * @param buffer - The decoded Avro payload.
 * @param wireFormat - The wire format of the payload. If not provided, the payload is returned as is.
 */
const stripWireFormatHeader = (buffer: Buffer, wireFormat?: string) => {
  if (wireFormat === undefined) {
    return buffer;
  }
  // Guards untyped (plain JavaScript) callers
  if (wireFormat !== WireFormat.CONFLUENT) {
    throw new KafkaConsumerDeserializationError(
      `Unsupported Avro wire format: ${wireFormat}`
    );
  }
  if (buffer.length < CONFLUENT_HEADER_SIZE) {
    throw new KafkaConsumerDeserializationError(
      'Invalid Confluent wire format: payload must contain a 5-byte header'
    );
  }
  if (buffer[0] !== CONFLUENT_MAGIC_BYTE) {
    throw new KafkaConsumerDeserializationError(
      'Invalid Confluent wire format: expected magic byte 0x00'
    );
  }
  return buffer.subarray(CONFLUENT_HEADER_SIZE);
};

/**
 * Create an Avro deserializer, importing `avro-js` on first use.
 *
 * The `avro-js` dependency is only required when deserializing Avro messages,
 * so it's resolved at runtime through a non-literal specifier. This keeps
 * bundlers (e.g. esbuild) from eagerly including `avro-js` - and failing when
 * it isn't installed - in builds that never use Avro.
 */
const createDeserializer = async (): Promise<AvroDeserializer> => {
  if (deserializer !== undefined) {
    return deserializer;
  }

  const moduleName = 'avro-js';
  const { default: avro }: typeof import('avro-js') = await import(moduleName);

  /**
   * Deserialize an Avro message from a base64-encoded string using the provided Avro schema.
   *
   * @param data - The base64-encoded string representing the Avro binary data.
   * @param schema - The Avro schema as a JSON string.
   * @param options - Deserialization options. If `options.wireFormat` is `confluent`, the 5-byte header is stripped.
   */
  deserializer = (data: string, schema: string, options) => {
    const buffer = stripWireFormatHeader(
      Buffer.from(data, 'base64'),
      options?.wireFormat
    );
    try {
      const type = avro.parse(schema);
      return type.fromBuffer(buffer);
    } catch (error) {
      throw new KafkaConsumerDeserializationError(
        `Failed to deserialize Avro message: ${error}, message: ${data}, schema: ${schema}`
      );
    }
  };

  return deserializer;
};

export { createDeserializer };
