import { KafkaConsumerDeserializationError } from '../errors.js';
import type { AvroDeserializer } from '../types/types.js';

let deserializer: AvroDeserializer | undefined;

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
   */
  deserializer = (data: string, schema: string) => {
    try {
      const type = avro.parse(schema);
      const buffer = Buffer.from(data, 'base64');
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
