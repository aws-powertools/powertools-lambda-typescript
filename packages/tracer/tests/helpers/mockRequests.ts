import { channel } from 'node:diagnostics_channel';
import type { URL } from 'node:url';
import { type Mock, vi } from 'vitest';

type MockRequestOptions = {
  origin?: string | URL;
  path?: string;
  method?: string;
};

type MockResponseOptions = {
  statusCode?: number;
  headers?: { [key: string]: string };
};

type MockRequest = MockRequestOptions & {
  method: string;
  addHeader: Mock;
};

type MockFetchOptions = MockRequestOptions &
  (
    | {
        statusCode?: never;
        headers?: MockResponseOptions['headers'];
        throwError?: boolean;
      }
    | {
        statusCode: number;
        headers?: MockResponseOptions['headers'];
        throwError?: never;
      }
  );

/**
 * Simulates the start of a fetch request by publishing the message to the `undici` channel
 *
 * @param options The options for the mock request
 */
const mockFetchRequest = ({
  origin,
  path,
  method,
}: MockRequestOptions): MockRequest => {
  const request = {
    origin,
    method: method ?? 'GET',
    path,
    addHeader: vi.fn(),
  };

  channel('undici:request:create').publish({ request });

  return request;
};

/**
 * Simulates the response to a request by publishing the message to the `undici` channel
 *
 * @param request The request the response is for
 * @param options The options for the mock response
 */
const mockFetchResponse = (
  request: MockRequest,
  { statusCode, headers }: MockResponseOptions = {}
): void => {
  const encoder = new TextEncoder();
  const encodedHeaders = [];
  for (const [key, value] of Object.entries(headers ?? {})) {
    encodedHeaders.push(encoder.encode(key), encoder.encode(value));
  }

  channel('undici:request:headers').publish({
    request,
    response: {
      statusCode: statusCode ?? 200,
      headers: encodedHeaders,
    },
  });
};

/**
 * Simulates a failed request by publishing the message to the `undici` channel
 *
 * @param request The request that failed
 * @param error The error the request failed with
 */
const mockFetchError = (request: MockRequest, error: Error): void => {
  channel('undici:request:error').publish({ request, error });
};

/**
 * Simulates a fetch request by publishing messages to the undici channel
 *
 * @see {@link https://nodejs.org/api/diagnostics_channel.html#diagnostics_channel_channel_publish | Diagnostics Channel - Node.js Documentation}
 *
 * @param options The options for the mock fetch
 */
const mockFetch = ({
  origin,
  path,
  method,
  statusCode,
  headers,
  throwError,
}: MockFetchOptions): MockRequest => {
  const request = mockFetchRequest({ origin, path, method });

  if (throwError) {
    const error = new AggregateError([], 'Mock fetch error');

    mockFetchError(request, error);

    throw error;
  }

  mockFetchResponse(request, { statusCode, headers });

  return request;
};

export { mockFetch, mockFetchError, mockFetchRequest, mockFetchResponse };
