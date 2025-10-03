import type { OutgoingHttpHeaders } from 'node:http';
import https, { type RequestOptions } from 'node:https';

/**
 * Make an HTTP request using the built-in `https` module
 *
 * This helper function is used in Tracer's tests to make HTTP requests
 * and assert that the requests are being traced correctly.
 *
 * If the requests are traced correctly, then all 3rd party libraries
 * built on top of the `https` module should also be traced correctly.
 *
 * @param params - The request options
 */
const httpRequest = (params: RequestOptions): Promise<unknown> =>
  new Promise((resolve, reject) => {
    if (!params.protocol) {
      params.protocol = 'https:';
    }
    if (!params.timeout) {
      params.timeout = 5000;
    }

    // Ensure some common headers are present. Many sites (including AWS docs)
    // block requests that don't include a User-Agent or typical Accept header,
    // which is why the `fetch` call (which sets defaults) succeeds while a
    // bare https.request may receive a 403.
    const originalHeaders = (params.headers ?? {}) as OutgoingHttpHeaders;
    // Create a quick lowercase map of header names to detect presence case-insensitively
    const lowerMap = Object.keys(originalHeaders).reduce<
      Record<string, string>
    >((acc, k) => {
      acc[k.toLowerCase()] = k;
      return acc;
    }, {});

    // Only add defaults when not present (case-insensitive)
    if (!lowerMap['user-agent']) {
      // prefer a Node/undici-like UA to match what fetch/undici would send
      (originalHeaders as Record<string, string>)['User-Agent'] =
        'node-fetch/1.0 (+https://github.com/node-fetch/node-fetch)';
    }
    if (!lowerMap.accept) {
      (originalHeaders as Record<string, string>).Accept =
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
    }

    params.headers = originalHeaders;

    const req = https.request(params, (res) => {
      if (
        res.statusCode == null ||
        res.statusCode < 200 ||
        res.statusCode >= 300
      ) {
        return reject(new Error(`statusCode=${res.statusCode || 'unknown'}`));
      }
      const incomingData: Uint8Array[] = [];
      let responseBody: string;
      res.on('data', (chunk) => {
        incomingData.push(chunk);
      });
      res.on('end', () => {
        try {
          responseBody = Buffer.concat(incomingData).toString();
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Unknown error'));
        }
        resolve(responseBody);
      });
    });
    req.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(error));
    });

    req.end();
  });

export { httpRequest };
