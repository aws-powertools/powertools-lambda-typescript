import type {
  GenericLogger,
  JSONObject,
} from '@aws-lambda-powertools/commons/types';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import type { HttpStatusCodes, HttpVerbs } from '../rest/constants.js';
import type { Route } from '../rest/Route.js';
import type { Router } from '../rest/Router.js';
import type { ResolveOptions } from './common.js';

type RequestContext = {
  req: Request;
  event: APIGatewayProxyEvent;
  context: Context;
  res: Response;
  params: Record<string, string>;
};

type ErrorResolveOptions = RequestContext & ResolveOptions;

type ErrorHandler<T extends Error = Error> = (
  error: T,
  reqCtx: RequestContext
) => Promise<HandlerResponse>;

interface ErrorConstructor<T extends Error = Error> {
  // biome-ignore lint/suspicious/noExplicitAny: this is a generic type that is intentionally open
  new (...args: any[]): T;
  prototype: T;
}

/**
 * Options for the {@link Router | `Router``} class
 */
type RestRouterOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger?: GenericLogger;
  /**
   * The base prefix to be used for all routes registered using this Router.
   */
  prefix?: Path;
};

interface CompiledRoute {
  path: Path;
  regex: RegExp;
  paramNames: string[];
  isDynamic: boolean;
}

type DynamicRoute = Route & CompiledRoute;

type HandlerResponse = Response | JSONObject;

type RouteHandler<TReturn = HandlerResponse> = (
  reqCtx: RequestContext
) => Promise<TReturn> | TReturn;

type HttpMethod = keyof typeof HttpVerbs;

type HttpStatusCode = (typeof HttpStatusCodes)[keyof typeof HttpStatusCodes];

type Path = `/${string}` | RegExp;

type RestRouteHandlerOptions = {
  handler: RouteHandler;
  params: Record<string, string>;
  rawParams: Record<string, string>;
  middleware: Middleware[];
};

type RestRouteOptions = {
  method: HttpMethod | HttpMethod[];
  path: Path;
  middleware?: Middleware[];
};

// biome-ignore lint/suspicious/noConfusingVoidType: To ensure next function is awaited
type NextFunction = () => Promise<HandlerResponse | void>;

type Middleware = (args: {
  reqCtx: RequestContext;
  next: NextFunction;
  // biome-ignore lint/suspicious/noConfusingVoidType: To ensure next function is awaited
}) => Promise<HandlerResponse | void>;

type RouteRegistryOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
};

type ErrorHandlerRegistryOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
};

type ValidationResult = {
  isValid: boolean;
  issues: string[];
};

/**
 * Configuration options for CORS middleware
 */
type CorsOptions = {
  /**
   * The Access-Control-Allow-Origin header value.
   * Can be a string, array of strings.
   * @default '*'
   */
  origin?: string | string[];

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
};

type CompressionOptions = {
  encoding?: 'gzip' | 'deflate';
  threshold?: number;
};

export type {
  CompiledRoute,
  CorsOptions,
  DynamicRoute,
  ErrorConstructor,
  ErrorHandlerRegistryOptions,
  ErrorHandler,
  ErrorResolveOptions,
  HandlerResponse,
  HttpStatusCode,
  HttpMethod,
  Middleware,
  Path,
  RequestContext,
  RestRouterOptions,
  RouteHandler,
  RestRouteOptions,
  RestRouteHandlerOptions,
  RouteRegistryOptions,
  ValidationResult,
  CompressionOptions,
  NextFunction,
};
