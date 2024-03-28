import { channel } from 'node:diagnostics_channel';

type MockFetchOptions = {
  origin: string;
  method?: string;
  statusCode?: number;
  headers?: { [key: string]: string };
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
  method,
  statusCode,
  headers,
}: MockFetchOptions): void => {
  const requestStart = channel('undici:request:create');
  const response = channel('undici:request:headers');
  const requestEnd = channel('undici:request:trailers');

  requestStart.publish({
    request: {
      origin,
    },
  });

  const encoder = new TextEncoder();
  const encodedHeaders = [];
  for (const [key, value] of Object.entries(headers ?? {})) {
    encodedHeaders.push(encoder.encode(key));
    encodedHeaders.push(encoder.encode(value));
  }
  response.publish({
    request: {
      origin,
      method: method ?? 'GET',
    },
    response: {
      statusCode: statusCode ?? 200,
      headers: encodedHeaders,
    },
  });
  requestEnd.publish({});
};

export { mockFetch };
