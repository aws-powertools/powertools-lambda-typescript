import type { HttpSubsegment } from '../types/ProviderService.js';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import { URL } from 'node:url';

const decoder = new TextDecoder();

/**
 * The `fetch` implementation based on `undici` includes the headers as an array of encoded key-value pairs.
 * This function finds the header with the given key and decodes the value.
 *
 * The function walks through the array of encoded headers and decodes the key of each pair.
 * If the key matches the given key, the function returns the decoded value of the next element in the array.
 *
 * @param encodedHeaders The array of encoded headers
 * @param key The key to search for
 */
const findHeaderAndDecode = (
  encodedHeaders: Uint8Array[],
  key: string
): string | null => {
  let foundIndex = -1;
  for (let i = 0; i < encodedHeaders.length; i += 2) {
    const header = decoder.decode(encodedHeaders[i]);
    if (header.toLowerCase() === key) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    return null;
  }

  return decoder.decode(encodedHeaders[foundIndex + 1]);
};

/**
 * Type guard to check if the given subsegment is an `HttpSubsegment`
 *
 * @param subsegment The subsegment to check
 */
const isHttpSubsegment = (
  subsegment: Segment | Subsegment | undefined
): subsegment is HttpSubsegment => {
  return (
    subsegment !== undefined &&
    'http' in subsegment &&
    'parent' in subsegment &&
    'namespace' in subsegment &&
    subsegment.namespace === 'remote'
  );
};

/**
 * Convert the origin url to a URL object when it is a string
 *
 * @param origin The origin url
 */
const getOriginURL = (origin: string | URL): URL => {
  return origin instanceof URL ? origin : new URL(origin);
};

export { findHeaderAndDecode, isHttpSubsegment, getOriginURL };
