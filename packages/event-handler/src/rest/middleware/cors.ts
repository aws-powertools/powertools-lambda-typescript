import type { CorsOptions, Middleware } from '../../types/rest.js';
import {
  DEFAULT_CORS_OPTIONS,
  HttpErrorCodes,
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

  return async (_params, reqCtx, next) => {
    const requestOrigin = reqCtx.request.headers.get('Origin');
    if (
      !requestOrigin ||
      (!allowsWildcard && !allowedOrigins.includes(requestOrigin))
    ) {
      await next();
      return;
    }

    const isOptions = reqCtx.request.method === HttpVerbs.OPTIONS;
    // Handle preflight OPTIONS request
    if (isOptions) {
      const requestMethod = reqCtx.request.headers.get(
        'Access-Control-Request-Method'
      );
      const requestHeaders = reqCtx.request.headers.get(
        'Access-Control-Request-Headers'
      );
      if (
        !requestMethod ||
        !config.allowMethods.includes(requestMethod) ||
        !requestHeaders ||
        requestHeaders
          .split(',')
          .some((header) => !config.allowHeaders.includes(header.trim()))
      ) {
        await next();
        return;
      }
    }

    const resolvedOrigin = allowsWildcard ? '*' : requestOrigin;
    reqCtx.res.headers.set('access-control-allow-origin', resolvedOrigin);
    if (!allowsWildcard && Array.isArray(config.origin)) {
      reqCtx.res.headers.set('vary', 'Origin');
    }
    if (config.credentials) {
      reqCtx.res.headers.set('access-control-allow-credentials', 'true');
    }

    if (isOptions) {
      if (config.maxAge !== undefined) {
        reqCtx.res.headers.set(
          'access-control-max-age',
          config.maxAge.toString()
        );
      }
      config.allowMethods.forEach((method) => {
        reqCtx.res.headers.append('access-control-allow-methods', method);
      });
      config.allowHeaders.forEach((header) => {
        reqCtx.res.headers.append('access-control-allow-headers', header);
      });
      return new Response(null, {
        status: HttpErrorCodes.NO_CONTENT,
        headers: reqCtx.res.headers,
      });
    }

    config.exposeHeaders.forEach((header) => {
      reqCtx.res.headers.append('access-control-expose-headers', header);
    });

    await next();
  };
};
