const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Convert a base64 string to a Uint8Array.
 *
 * The input string must be a valid base64 string, otherwise an error will be thrown.
 *
 * The encoding parameter is optional and defaults to 'utf-8'.
 *
 * @example
 * ```ts
 * import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
 *
 * const encodedValue = 'aGVsbG8gd29ybGQ=';
 *
 * const decoded = fromBase64(encodedValue);
 * // new Uint8Array([ 97, 71, 86, 115, 98, 71, 56, 103, 100, 50, 57, 121, 98, 71, 81, 61 ]);
 * ```
 *
 * @param input The base64 string to convert to a Uint8Array
 * @param encoding The encoding of the input string (optional)
 */
const fromBase64 = (input: string, encoding?: BufferEncoding): Uint8Array => {
  if ((input.length * 3) % 4 !== 0) {
    throw new TypeError('Incorrect padding on base64 string.');
  }
  if (!BASE64_REGEX.exec(input)) {
    throw new TypeError('Invalid base64 string.');
  }
  const buffer = encoding ? Buffer.from(input, encoding) : Buffer.from(input);

  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
};

export { fromBase64 };
