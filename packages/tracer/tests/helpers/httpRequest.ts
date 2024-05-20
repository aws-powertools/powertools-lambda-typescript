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
          reject(error);
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
