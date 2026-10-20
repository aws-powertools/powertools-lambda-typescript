import { URL } from 'node:url';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import type { DiagnosticsChannel } from 'undici-types';
import type { IncomingHttpHeaders } from 'undici-types/header.js';
import type { HttpSubsegment } from '../types/ProviderService.js';

const decoder = new TextDecoder();

/**
 * Finds the header with the given key and return its value as a string.
 *
 * Over HTTP/1, `undici` publishes the headers as a flat array of encoded key-value pairs;
 * over HTTP/2 it publishes them as an object with lowercase keys.
 *
 * @param headers The response headers published by `undici`
 * @param key The lowercase key to search for
 */
const findHeaderAndDecode = (
  headers: Uint8Array[] | IncomingHttpHeaders,
  key: string
): string | null => {
  if (!Array.isArray(headers)) {
    const value = headers[key];
    return (Array.isArray(value) ? value[0] : value) ?? null;
  }

  let foundIndex = -1;
  for (let i = 0; i < headers.length; i += 2) {
    const header = decoder.decode(headers[i]);
    if (header.toLowerCase() === key) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    return null;
  }

  return decoder.decode(headers[foundIndex + 1]);
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
 * Convert the origin url to a URL object when it is a string and append the path if provided
 *
 * @param origin The request object containing the origin url and path
 */
const getRequestURL = (
  request: DiagnosticsChannel.Request
): URL | undefined => {
  if (typeof request.origin === 'string') {
    return new URL(`${request.origin}${request.path || ''}`);
  }

  if (request.origin instanceof URL) {
    request.origin.pathname = request.path || '';

    return request.origin;
  }

  return undefined;
};

export { findHeaderAndDecode, getRequestURL, isHttpSubsegment };
