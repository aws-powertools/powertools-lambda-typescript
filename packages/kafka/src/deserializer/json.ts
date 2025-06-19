import { deserialize as deserializePrimitive } from './primitive.js';

/**
 * Deserialize a base64 encoded string into either a JSON object or plain string
 *
 * @param data - The base64 encoded string to deserialize
 * @returns The deserialized data as either a JSON object or string
 */
const deserialize = (data: string) => {
  const plainText = deserializePrimitive(data);
  try {
    // Attempt to parse the decoded data as JSON
    // we assume it's a JSON but it can also be a string, we don't know
    return JSON.parse(plainText);
  } catch (error) {
    // If JSON parsing fails, log the error and return the decoded string
    // in case we could not parse it we return the base64 decoded value
    console.error(`Failed to parse JSON from base64 value: ${data}`, error);
    return plainText;
  }
};

export { deserialize };
