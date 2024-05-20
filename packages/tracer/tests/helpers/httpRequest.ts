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
    const req = https.request(params, (res) => {
      // reject on bad status
      if (
        res.statusCode == null ||
        res.statusCode < 200 ||
        res.statusCode >= 300
      ) {
        return reject(new Error(`statusCode=${res.statusCode || 'unknown'}`));
      }
      // cumulate data
      let body: Uint8Array[] = [];
      res.on('data', (chunk) => {
        body.push(chunk);
      });
      // resolve on end
      res.on('end', () => {
        try {
          body = JSON.parse(Buffer.concat(body).toString());
        } catch (e) {
          reject(e);
        }
        resolve(body);
      });
    });
    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });

export { httpRequest };
