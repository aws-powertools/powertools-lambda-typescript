import { channel } from 'node:diagnostics_channel';
import type { URL } from 'node:url';

type MockFetchOptions = {
  origin?: string | URL;
  path?: string;
  method?: string;
  headers?: { [key: string]: string };
} & (
  | {
      statusCode?: never;
      throwError?: boolean;
    }
  | {
      statusCode: number;
      throwError?: never;
    }
);

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
}: MockFetchOptions): void => {
  const requestCreateChannel = channel('undici:request:create');
  const responseHeadersChannel = channel('undici:request:headers');
  const errorChannel = channel('undici:request:error');

  const request = {
    origin,
    method: method ?? 'GET',
    path,
  };

  requestCreateChannel.publish({
    request,
  });

  if (throwError) {
    const error = new AggregateError('Mock fetch error');

    errorChannel.publish({
      request,
      error,
    });

    throw error;
  }

  const encoder = new TextEncoder();
  const encodedHeaders = [];
  for (const [key, value] of Object.entries(headers ?? {})) {
    encodedHeaders.push(encoder.encode(key));
    encodedHeaders.push(encoder.encode(value));
  }
  responseHeadersChannel.publish({
    request,
    response: {
      statusCode: statusCode ?? 200,
      headers: encodedHeaders,
    },
  });
};

export { mockFetch };
