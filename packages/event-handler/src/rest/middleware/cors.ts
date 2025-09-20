import type {
  CorsOptions,
  Middleware,
} from '../../types/rest.js';
import {
  DEFAULT_CORS_OPTIONS,
  HttpErrorCodes,
  HttpVerbs,
} from '../constants.js';

/**
 * Resolves the origin value based on the configuration
 */
const resolveOrigin = (
  originConfig: NonNullable<CorsOptions['origin']>,
  requestOrigin: string | null,
): string => {
  if (Array.isArray(originConfig)) {
    return requestOrigin && originConfig.includes(requestOrigin) ? requestOrigin : '';
  }
  return originConfig;
};

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
    ...options
  };

  return async (_params, reqCtx, next) => {
    const requestOrigin = reqCtx.request.headers.get('Origin');
    const resolvedOrigin = resolveOrigin(config.origin, requestOrigin);

    reqCtx.res.headers.set('access-control-allow-origin', resolvedOrigin);
    if (resolvedOrigin !== '*') {
      reqCtx.res.headers.set('Vary', 'Origin');
    }
    config.allowMethods.forEach(method => {
      reqCtx.res.headers.append('access-control-allow-methods', method);
    });
    config.allowHeaders.forEach(header => {
      reqCtx.res.headers.append('access-control-allow-headers', header);
    });
    config.exposeHeaders.forEach(header => {
      reqCtx.res.headers.append('access-control-expose-headers', header);
    });
    reqCtx.res.headers.set('access-control-allow-credentials', config.credentials.toString());
    if (config.maxAge !== undefined) {
      reqCtx.res.headers.set('access-control-max-age', config.maxAge.toString());
    }

    // Handle preflight OPTIONS request
    if (reqCtx.request.method === HttpVerbs.OPTIONS && reqCtx.request.headers.has('Access-Control-Request-Method')) {
      return new Response(null, {
        status: HttpErrorCodes.NO_CONTENT,
        headers: reqCtx.res.headers,
      });
    }
    await next();
  };
};
