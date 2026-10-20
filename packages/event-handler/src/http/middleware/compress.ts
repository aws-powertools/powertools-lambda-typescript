import type { CompressionOptions } from '../../types/http.js';
import type { Middleware } from '../../types/index.js';
import {
  CACHE_CONTROL_NO_TRANSFORM_REGEX,
  COMPRESSION_ENCODING_TYPES,
  DECIMAL_QVALUE_REGEX,
  DEFAULT_COMPRESSION_RESPONSE_THRESHOLD,
} from '../constants.js';

/**
 * Compresses HTTP response bodies using standard compression algorithms.
 *
 * This middleware automatically compresses response bodies when they exceed
 * a specified threshold and the client supports compression. It respects
 * cache-control directives and only compresses appropriate content types.
 *
 * The middleware checks several conditions before compressing:
 * - Response is not already encoded or chunked
 * - Request method is not HEAD
 * - Content length exceeds the threshold
 * - Content type is compressible
 * - Cache-Control header doesn't contain no-transform
 * - Response has a body
 *
 * **Basic compression with default settings**
 *
 * @example
 * ```typescript
 * import { Router } from '@aws-lambda-powertools/event-handler/http';
 * import { compress } from '@aws-lambda-powertools/event-handler/http/middleware';
 *
 * const app = new Router();
 *
 * app.use(compress());
 *
 * app.get('/api/data', async () => {
 *   return { data: 'large response body...' };
 * });
 * ```
 *
 * **Custom compression settings**
 *
 * @example
 * ```typescript
 * import { Router } from '@aws-lambda-powertools/event-handler/http';
 * import { compress } from '@aws-lambda-powertools/event-handler/http/middleware';
 *
 * const app = new Router();
 *
 * app.use(compress({
 *   threshold: 2048,
 *   encoding: 'deflate'
 * }));
 *
 * app.get('/api/large-data', async () => {
 *   return { data: 'very large response...' };
 * });
 * ```
 *
 * @param options - Configuration options for compression behavior
 * @param options.threshold - Minimum response size in bytes to trigger compression (default: 1024)
 * @param options.encoding - Preferred compression encoding to use when client supports multiple formats
 */

const compress = (options?: CompressionOptions): Middleware => {
  const preferredEncoding =
    options?.encoding ?? COMPRESSION_ENCODING_TYPES.GZIP;
  const threshold =
    options?.threshold ?? DEFAULT_COMPRESSION_RESPONSE_THRESHOLD;

  return async ({ reqCtx, next }) => {
    await next();

    const transferEncoding = reqCtx.res.headers.get('transfer-encoding');
    if (transferEncoding === 'chunked') return;

    if (reqCtx.res.body !== null && !reqCtx.res.headers.has('content-length')) {
      const body = await reqCtx.res.clone().arrayBuffer();
      reqCtx.res.headers.set('content-length', body.byteLength.toString());
    }

    if (!shouldCompress(reqCtx.req, reqCtx.res, preferredEncoding, threshold)) {
      return;
    }

    // Compress the response
    const stream = new CompressionStream(preferredEncoding);
    reqCtx.res = new Response(reqCtx.res.body.pipeThrough(stream), reqCtx.res);
    reqCtx.res.headers.delete('content-length');
    reqCtx.res.headers.set('content-encoding', preferredEncoding);
  };
};

/**
 * Gets the quality value from an Accept-Encoding coding's parameters.
 *
 * Missing `q` defaults to 1; plain decimals (e.g. `1`, `0.5`, `.5`) are capped at 1; anything else returns 0.
 *
 * Quality values: https://www.rfc-editor.org/rfc/rfc9110.html#section-12.4.2
 *
 * @param parameters - The coding parameters to inspect
 */
const getQuality = (parameters: string[]): number => {
  for (const parameter of parameters) {
    const separator = parameter.indexOf('=');
    const name = separator === -1 ? parameter : parameter.slice(0, separator);

    if (name.trim().toLowerCase() !== 'q') continue;
    if (separator === -1) return 0;

    const value = parameter.slice(separator + 1).trim();
    if (!DECIMAL_QVALUE_REGEX.test(value)) return 0;

    return Math.min(Number(value), 1);
  }

  return 1;
};

/**
 * Checks whether the preferred compression encoding is at least as acceptable as identity.
 *
 * When both have the same quality, the server preference for compression wins.
 *
 * @param header - The value of the Accept-Encoding header from the request
 * @param preferredEncoding - The preferred compression encoding to use
 */
const acceptsEncoding = (
  header: string | null,
  preferredEncoding: NonNullable<CompressionOptions['encoding']>
): boolean => {
  if (header === null) return true;

  // Exact coding matches take precedence over the `*` wildcard.
  let preferredQuality: number | undefined;
  let identityQuality: number | undefined;
  let wildcardQuality: number | undefined;
  for (const entry of header.split(',')) {
    const [rawCoding, ...parameters] = entry.split(';');
    let coding = rawCoding.trim().toLowerCase();
    if (coding === 'x-gzip') coding = COMPRESSION_ENCODING_TYPES.GZIP; // RFC 9110 §8.4.1.3 alias
    const quality = getQuality(parameters);

    if (coding === preferredEncoding) preferredQuality ??= quality;
    if (coding === COMPRESSION_ENCODING_TYPES.IDENTITY)
      identityQuality ??= quality;
    if (coding === COMPRESSION_ENCODING_TYPES.ANY) wildcardQuality ??= quality;
  }

  const compressionQuality = preferredQuality ?? wildcardQuality ?? 0;
  const uncompressedQuality =
    identityQuality ?? wildcardQuality ?? compressionQuality;

  return compressionQuality > 0 && compressionQuality >= uncompressedQuality;
};

const shouldCompress = (
  request: Request,
  response: Response,
  preferredEncoding: NonNullable<CompressionOptions['encoding']>,
  threshold: NonNullable<CompressionOptions['threshold']>
): response is Response & { body: NonNullable<Response['body']> } => {
  const contentLength = response.headers.get('content-length');
  const cacheControl = response.headers.get('cache-control');

  const isEncodedOrChunked =
    response.headers.has('content-encoding') ||
    response.headers.has('transfer-encoding');

  const shouldEncode = acceptsEncoding(
    request.headers.get('accept-encoding'),
    preferredEncoding
  );

  return (
    shouldEncode &&
    !isEncodedOrChunked &&
    request.method !== 'HEAD' &&
    (!contentLength || Number(contentLength) > threshold) &&
    (!cacheControl || !CACHE_CONTROL_NO_TRANSFORM_REGEX.test(cacheControl)) &&
    response.body !== null
  );
};

export { compress };
