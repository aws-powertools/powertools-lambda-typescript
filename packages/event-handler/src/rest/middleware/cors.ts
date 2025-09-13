import type { Middleware, RequestContext, HandlerResponse } from '../../types/rest.js';
import { HttpErrorCodes, HttpVerbs } from '../constants.js';

/**
 * Configuration options for CORS middleware
 */
export interface CorsOptions {
  /**
   * The Access-Control-Allow-Origin header value.
   * Can be a string, array of strings, or a function that returns a string or boolean.
   * @default '*'
   */
  origin?: string | string[] | ((origin: string | undefined, reqCtx: RequestContext) => string | boolean);
  
  /**
   * The Access-Control-Allow-Methods header value.
   * @default ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT']
   */
  allowMethods?: string[];
  
  /**
   * The Access-Control-Allow-Headers header value.
   * @default ['Authorization', 'Content-Type', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token']
   */
  allowHeaders?: string[];
  
  /**
   * The Access-Control-Expose-Headers header value.
   * @default []
   */
  exposeHeaders?: string[];
  
  /**
   * The Access-Control-Allow-Credentials header value.
   * @default false
   */
  credentials?: boolean;
  
  /**
   * The Access-Control-Max-Age header value in seconds.
   * Only applicable for preflight requests.
   */
  maxAge?: number;
}

/**
 * Resolved CORS configuration with all defaults applied
 */
interface ResolvedCorsConfig {
  origin: CorsOptions['origin'];
  allowMethods: string[];
  allowHeaders: string[];
  exposeHeaders: string[];
  credentials: boolean;
  maxAge?: number;
}

/**
 * Default CORS configuration matching Python implementation
 */
const DEFAULT_CORS_OPTIONS: Required<Omit<CorsOptions, 'maxAge'>> = {
  origin: '*',
  allowMethods: ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'],
  allowHeaders: ['Authorization', 'Content-Type', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
  exposeHeaders: [],
  credentials: false,
};

/**
 * Resolves and validates the CORS configuration
 */
function resolveConfiguration(userOptions: CorsOptions): ResolvedCorsConfig {
  const config: ResolvedCorsConfig = {
    origin: userOptions.origin ?? DEFAULT_CORS_OPTIONS.origin,
    allowMethods: userOptions.allowMethods ?? DEFAULT_CORS_OPTIONS.allowMethods,
    allowHeaders: userOptions.allowHeaders ?? DEFAULT_CORS_OPTIONS.allowHeaders,
    exposeHeaders: userOptions.exposeHeaders ?? DEFAULT_CORS_OPTIONS.exposeHeaders,
    credentials: userOptions.credentials ?? DEFAULT_CORS_OPTIONS.credentials,
    maxAge: userOptions.maxAge,
  };

  return config;
}

/**
 * Resolves the origin value based on the configuration
 */
function resolveOrigin(
  originConfig: CorsOptions['origin'],
  requestOrigin: string | null | undefined,
  reqCtx: RequestContext
): string {
  const origin = requestOrigin || undefined;
  
  if (typeof originConfig === 'function') {
    const result = originConfig(origin, reqCtx);
    if (typeof result === 'boolean') {
      return result ? (origin || '*') : '';
    }
    return result;
  }
  
  if (Array.isArray(originConfig)) {
    return origin && originConfig.includes(origin) ? origin : '';
  }
  
  if (typeof originConfig === 'string') {
    return originConfig;
  }
  
  return DEFAULT_CORS_OPTIONS.origin as string;
}

/**
 * Handles preflight OPTIONS requests
 */
function handlePreflight(config: ResolvedCorsConfig, reqCtx: RequestContext): Response {
  const { request } = reqCtx;
  const requestOrigin = request.headers.get('Origin');
  const resolvedOrigin = resolveOrigin(config.origin, requestOrigin, reqCtx);

  const headers = new Headers();
  
  if (resolvedOrigin) {
    headers.set('Access-Control-Allow-Origin', resolvedOrigin);
  }
  
  if (config.allowMethods.length > 0) {
    headers.set('Access-Control-Allow-Methods', config.allowMethods.join(', '));
  }
  
  if (config.allowHeaders.length > 0) {
    headers.set('Access-Control-Allow-Headers', config.allowHeaders.join(', '));
  }
  
  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  if (config.maxAge !== undefined) {
    headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }

  return new Response(null, {
    status: HttpErrorCodes.NO_CONTENT, // 204
    headers,
  });
}

/**
 * Adds CORS headers to regular requests
 */
function addCorsHeaders(config: ResolvedCorsConfig, reqCtx: RequestContext): void {
  const { request, res } = reqCtx;
  const requestOrigin = request.headers.get('Origin');
  const resolvedOrigin = resolveOrigin(config.origin, requestOrigin, reqCtx);

  if (resolvedOrigin) {
    res.headers.set('Access-Control-Allow-Origin', resolvedOrigin);
  }
  
  if (config.exposeHeaders.length > 0) {
    res.headers.set('Access-Control-Expose-Headers', config.exposeHeaders.join(', '));
  }
  
  if (config.credentials) {
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
}

/**
 * Creates a CORS middleware that adds appropriate CORS headers to responses
 * and handles OPTIONS preflight requests.
 * 
 * @param options - CORS configuration options
 * @returns A middleware function that handles CORS
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
 */
export const cors = (options: CorsOptions = {}): Middleware => {
  const config = resolveConfiguration(options);
  
  return async (_params: Record<string, string>, reqCtx: RequestContext, next: () => Promise<HandlerResponse | void>) => {
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