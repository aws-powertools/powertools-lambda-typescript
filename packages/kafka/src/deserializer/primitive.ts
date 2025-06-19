import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';

const decoder = new TextDecoder('utf-8');

/**
 * Deserialize a base64-encoded primitive value (string).
 *
 * When customers don't provide a schema configuration, we assume the value is a base64-encoded string.
 *
 * @param data - The base64-encoded string to deserialize.
 */
const deserialize = (data: string) => {
  return decoder.decode(fromBase64(data, 'base64'));
};

export { deserialize };
