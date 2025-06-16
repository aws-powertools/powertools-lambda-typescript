import { KafkaConsumerDeserializationError } from '../errors.js';

/**
 * Deserialises an Avro message from a base64-encoded string using the provided Avro schema.
 *
 * @param data - The base64-encoded string representing the Avro binary data.
 * @param schema - The Avro schema as a JSON string.
 * @returns The deserialised Avro message as a JavaScript object.
 * @throws {KafkaConsumerDeserializationError} If deserialization fails.
 */
export const deserialize = async (data: string, schema: string) => {
  try {
    // Dynamically import the avro-js library
    // @ts-ignore - this is a workaround for dynamic import in TypeScript
    const avro = await import('avro-js');
    const type = avro.parse(schema);
    const buffer = Buffer.from(data, 'base64');
    return type.fromBuffer(buffer);
  } catch (error) {
    throw new KafkaConsumerDeserializationError(
      `Failed to deserialize Avro message: ${error}, message: ${data}, schema: ${schema}`
    );
  }
};
