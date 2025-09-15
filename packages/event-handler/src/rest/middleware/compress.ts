import type { Middleware } from '../../types/index.js';
import type { CompressionOptions } from '../../types/rest.js';
import {
  CACHE_CONTROL_NO_TRANSFORM_REGEX,
  COMPRESSIBLE_CONTENT_TYPE_REGEX,
  COMPRESSION_ENCODING_TYPES,
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
 * import { Router } from '@aws-lambda-powertools/event-handler';
 * import { compress } from '@aws-lambda-powertools/event-handler/rest/middleware';
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
 * import { Router } from '@aws-lambda-powertools/event-handler';
 * import { compress } from '@aws-lambda-powertools/event-handler/rest/middleware';
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
  const threshold = options?.threshold ?? 1024;

  return async (_, reqCtx, next) => {
    await next();

    const contentLength = reqCtx.res.headers.get('content-length');
    const isEncodedOrChunked =
      reqCtx.res.headers.has('content-encoding') ||
      reqCtx.res.headers.has('transfer-encoding');

    // Check if response should be compressed
    if (
      isEncodedOrChunked ||
      reqCtx.request.method === 'HEAD' || // HEAD request
      (contentLength && Number(contentLength) < threshold) || // content-length below threshold
      !shouldCompress(reqCtx.res) || // not compressible type
      !shouldTransform(reqCtx.res) || // cache-control: no-transform
      !reqCtx.res.body
    ) {
      return;
    }

    const acceptedEncoding = reqCtx.request.headers.get('accept-encoding');
    const encoding =
      options?.encoding ??
      Object.values(COMPRESSION_ENCODING_TYPES).find((encoding) =>
        acceptedEncoding?.includes(encoding)
      ) ??
      COMPRESSION_ENCODING_TYPES.GZIP;

    // Compress the response
    const stream = new CompressionStream(encoding);
    reqCtx.res = new Response(reqCtx.res.body.pipeThrough(stream), reqCtx.res);
    reqCtx.res.headers.delete('content-length');
    reqCtx.res.headers.set('content-encoding', encoding);
  };
};

const shouldCompress = (res: Response) => {
  const type = res.headers.get('content-type');
  return type && COMPRESSIBLE_CONTENT_TYPE_REGEX.test(type);
};

const shouldTransform = (res: Response) => {
  const cacheControl = res.headers.get('cache-control');
  // Don't compress for Cache-Control: no-transform
  // https://tools.ietf.org/html/rfc7234#section-5.2.2.4
  return !cacheControl || !CACHE_CONTROL_NO_TRANSFORM_REGEX.test(cacheControl);
};

export { compress };
