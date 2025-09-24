import type { CorsOptions, Middleware } from '../../types/rest.js';
import {
  DEFAULT_CORS_OPTIONS,
  HttpStatusCodes,
  HttpVerbs,
} from '../constants.js';

/**
 * Creates a CORS middleware that adds appropriate CORS headers to responses
 * and handles OPTIONS preflight requests.
 *
 * @example
 * ```typescript
 * import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
 * import { cors } from '@aws-lambda-powertools/event-handler/experimental-rest/middleware';
 *
 * const app = new Router();
 *
 * // Use default configuration
 * app.use(cors());
 *
 * // Custom configuration
 * app.use(cors({
 *   origin: 'https://example.com',
 *   allowMethods: ['GET', 'POST'],
 *   credentials: true,
 * }));
 *
 * // Dynamic origin with function
 * app.use(cors({
 *   origin: (origin, reqCtx) => {
 *     const allowedOrigins = ['https://app.com', 'https://admin.app.com'];
 *     return origin && allowedOrigins.includes(origin);
 *   }
 * }));
 * ```
 *
 * @param options.origin - The origin to allow requests from
 * @param options.allowMethods - The HTTP methods to allow
 * @param options.allowHeaders - The headers to allow
 * @param options.exposeHeaders - The headers to expose
 * @param options.credentials - Whether to allow credentials
 * @param options.maxAge - The maximum age for the preflight response
 */
export const cors = (options?: CorsOptions): Middleware => {
  const config = {
    ...DEFAULT_CORS_OPTIONS,
    ...options,
  };
  const allowedOrigins =
    typeof config.origin === 'string' ? [config.origin] : config.origin;
  const allowsWildcard = allowedOrigins.includes('*');
  const allowedMethods = config.allowMethods.map((method) =>
    method.toUpperCase()
  );
  const allowedHeaders = config.allowHeaders.map((header) =>
    header.toLowerCase()
  );

  const isOriginAllowed = (
    requestOrigin: string | null
  ): requestOrigin is string => {
    return (
      requestOrigin !== null &&
      (allowsWildcard || allowedOrigins.includes(requestOrigin))
    );
  };

  const isValidPreflightRequest = (requestHeaders: Headers) => {
    const accessControlRequestMethod = requestHeaders
      .get('Access-Control-Request-Method')
      ?.toUpperCase();
    const accessControlRequestHeaders = requestHeaders
      .get('Access-Control-Request-Headers')
      ?.toLowerCase();
    return (
      accessControlRequestMethod &&
      allowedMethods.includes(accessControlRequestMethod) &&
      accessControlRequestHeaders
        ?.split(',')
        .every((header) => allowedHeaders.includes(header.trim()))
    );
  };

  const setCORSBaseHeaders = (
    requestOrigin: string,
    responseHeaders: Headers
  ) => {
    const resolvedOrigin = allowsWildcard ? '*' : requestOrigin;
    responseHeaders.set('access-control-allow-origin', resolvedOrigin);
    if (!allowsWildcard && Array.isArray(config.origin)) {
      responseHeaders.set('vary', 'Origin');
    }
    if (config.credentials) {
      responseHeaders.set('access-control-allow-credentials', 'true');
    }
  };

  return async ({ reqCtx, next }) => {
    const requestOrigin = reqCtx.req.headers.get('Origin');
    if (!isOriginAllowed(requestOrigin)) {
      await next();
      return;
    }

    // Handle preflight OPTIONS request
    if (reqCtx.req.method === HttpVerbs.OPTIONS) {
      if (!isValidPreflightRequest(reqCtx.req.headers)) {
        await next();
        return;
      }
      setCORSBaseHeaders(requestOrigin, reqCtx.res.headers);
      if (config.maxAge !== undefined) {
        reqCtx.res.headers.set(
          'access-control-max-age',
          config.maxAge.toString()
        );
      }
      for (const method of allowedMethods) {
        reqCtx.res.headers.append('access-control-allow-methods', method);
      }
      for (const header of allowedHeaders) {
        reqCtx.res.headers.append('access-control-allow-headers', header);
      }
      return new Response(null, {
        status: HttpStatusCodes.NO_CONTENT,
        headers: reqCtx.res.headers,
      });
    }

    setCORSBaseHeaders(requestOrigin, reqCtx.res.headers);
    for (const header of config.exposeHeaders) {
      reqCtx.res.headers.append('access-control-expose-headers', header);
    }
    await next();
  };
};
