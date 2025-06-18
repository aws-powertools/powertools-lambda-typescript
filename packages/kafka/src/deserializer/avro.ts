import avro from 'avro-js';
import { KafkaConsumerDeserializationError } from '../errors.js';

/**
 * Deserialize an Avro message from a base64-encoded string using the provided Avro schema.
 *
 * @param data - The base64-encoded string representing the Avro binary data.
 * @param schema - The Avro schema as a JSON string.
 */
export const deserialize = async (data: string, schema: string) => {
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
