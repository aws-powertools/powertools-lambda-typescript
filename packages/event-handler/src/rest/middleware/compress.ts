import type { Middleware } from '@aws-lambda-powertools/event-handler/types';
import type { CompressionOptions } from 'src/types/rest.js';
import {
  CACHE_CONTROL_NO_TRANSFORM_REGEX,
  COMPRESSIBLE_CONTENT_TYPE_REGEX,
  COMPRESSION_ENCODING_TYPES,
} from '../constants.js';

const compress = (options?: CompressionOptions): Middleware => {
  const threshold = options?.threshold ?? 1024;

  return async (_, reqCtx, next) => {
    await next();

    const contentLength = reqCtx.res.headers.get('content-length');

    // Check if response should be compressed
    if (
      reqCtx.res.headers.has('content-encoding') || // already encoded
      reqCtx.res.headers.has('transfer-encoding') || // already encoded or chunked
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
