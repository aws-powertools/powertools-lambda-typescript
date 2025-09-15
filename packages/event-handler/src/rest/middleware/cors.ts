import type {
  CorsOptions,
  HandlerResponse,
  Middleware,
  RequestContext,
} from '../../types/rest.js';
import {
  DEFAULT_CORS_OPTIONS,
  HttpErrorCodes,
  HttpVerbs,
} from '../constants.js';

/**
 * Resolved CORS configuration with all defaults applied
 */
type ResolvedCorsConfig = {
  origin: CorsOptions['origin'];
  allowMethods: string[];
  allowHeaders: string[];
  exposeHeaders: string[];
  credentials: boolean;
  maxAge?: number;
};

/**
 * Resolves and validates the CORS configuration
 */
const resolveConfiguration = (userOptions: CorsOptions): ResolvedCorsConfig => {
  return {
    origin: userOptions.origin ?? DEFAULT_CORS_OPTIONS.origin,
    allowMethods: userOptions.allowMethods ?? [
      ...DEFAULT_CORS_OPTIONS.allowMethods,
    ],
    allowHeaders: userOptions.allowHeaders ?? [
      ...DEFAULT_CORS_OPTIONS.allowHeaders,
    ],
    exposeHeaders: userOptions.exposeHeaders ?? [
      ...DEFAULT_CORS_OPTIONS.exposeHeaders,
    ],
    credentials: userOptions.credentials ?? DEFAULT_CORS_OPTIONS.credentials,
    maxAge: userOptions.maxAge,
  };
};

/**
 * Resolves the origin value based on the configuration
 */
const resolveOrigin = (
  originConfig: CorsOptions['origin'],
  requestOrigin: string | null | undefined,
  reqCtx: RequestContext
): string => {
  const origin = requestOrigin || undefined;

  if (typeof originConfig === 'function') {
    const result = originConfig(origin, reqCtx);
    if (typeof result === 'boolean') {
      return result ? origin || '*' : '';
    }
    return result;
  }

  if (Array.isArray(originConfig)) {
    return origin && originConfig.includes(origin) ? origin : '';
  }

  if (typeof originConfig === 'string') {
    return originConfig;
  }

  return DEFAULT_CORS_OPTIONS.origin;
};

/**
 * Handles preflight OPTIONS requests
 */
const handlePreflight = (
  config: ResolvedCorsConfig,
  reqCtx: RequestContext
): Response => {
  const { request, res } = reqCtx;
  const requestOrigin = request.headers.get('Origin');
  const resolvedOrigin = resolveOrigin(config.origin, requestOrigin, reqCtx);

  // Mutate existing response headers
  if (resolvedOrigin) {
    res.headers.set('Access-Control-Allow-Origin', resolvedOrigin);
  }

  if (config.allowMethods.length > 0) {
    res.headers.set(
      'Access-Control-Allow-Methods',
      config.allowMethods.join(', ')
    );
  }

  if (config.allowHeaders.length > 0) {
    res.headers.set(
      'Access-Control-Allow-Headers',
      config.allowHeaders.join(', ')
    );
  }

  if (config.credentials) {
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (config.maxAge !== undefined) {
    res.headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }

  return new Response(null, {
    status: HttpErrorCodes.NO_CONTENT,
    headers: res.headers,
  });
};

/**
 * Adds CORS headers to regular requests
 */
const addCorsHeaders = (
  config: ResolvedCorsConfig,
  reqCtx: RequestContext
): void => {
  const { request, res } = reqCtx;
  const requestOrigin = request.headers.get('Origin');
  const resolvedOrigin = resolveOrigin(config.origin, requestOrigin, reqCtx);

  if (resolvedOrigin) {
    res.headers.set('Access-Control-Allow-Origin', resolvedOrigin);
  }

  if (config.exposeHeaders.length > 0) {
    res.headers.set(
      'Access-Control-Expose-Headers',
      config.exposeHeaders.join(', ')
    );
  }

  if (config.credentials) {
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
};

/**
 * Creates a CORS middleware that adds appropriate CORS headers to responses
 * and handles OPTIONS preflight requests.
 *
 * @example
 * ```typescript
 * import { cors } from '@aws-lambda-powertools/event-handler/rest';
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
 * @param options - CORS configuration options
 */
export const cors = (options: CorsOptions = {}): Middleware => {
  const config = resolveConfiguration(options);
  
  return async (
    _params: Record<string, string>,
    reqCtx: RequestContext,
    next: () => Promise<HandlerResponse | void>
  ) => {
    const { request } = reqCtx;
    const method = request.method.toUpperCase();
    
    // Handle preflight OPTIONS request
    if (method === HttpVerbs.OPTIONS) {
      return handlePreflight(config, reqCtx);
    }
    
    // Continue to next middleware/handler first
    await next();
    
    // Add CORS headers to the response after handler
    addCorsHeaders(config, reqCtx);
  };
};
