import type {
  GenericLogger,
  JSONObject,
} from '@aws-lambda-powertools/commons/types';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import type { HttpErrorCodes, HttpVerbs } from '../rest/constants.js';
import type { Route } from '../rest/Route.js';
import type { Router } from '../rest/Router.js';
import type { ResolveOptions } from './common.js';

type ErrorResponse = {
  statusCode: HttpStatusCode;
  error: string;
  message: string;
};

type RequestContext = {
  request: Request;
  event: APIGatewayProxyEvent;
  context: Context;
  res: Response;
};

type ErrorResolveOptions = RequestContext & ResolveOptions;

type ErrorHandler<T extends Error = Error> = (
  error: T,
  reqCtx: RequestContext
) => Promise<ErrorResponse>;

interface ErrorConstructor<T extends Error = Error> {
  new (...args: any[]): T;
  prototype: T;
}

/**
 * Options for the {@link Router} class
 */
type RestRouterOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger?: GenericLogger;
};

interface CompiledRoute {
  path: Path;
  regex: RegExp;
  paramNames: string[];
  isDynamic: boolean;
}

type DynamicRoute = Route & CompiledRoute;

type HandlerResponse = Response | JSONObject;

type RouteHandler<
  TParams = Record<string, unknown>,
  TReturn = HandlerResponse,
> = (args: TParams, reqCtx: RequestContext) => Promise<TReturn>;

type HttpMethod = keyof typeof HttpVerbs;

type HttpStatusCode = (typeof HttpErrorCodes)[keyof typeof HttpErrorCodes];

type Path = `/${string}`;

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

type NextFunction = () => Promise<HandlerResponse | void>;

type Middleware = (
  params: Record<string, string>,
  reqCtx: RequestContext,
  next: NextFunction
) => Promise<void | HandlerResponse>;

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
  ErrorResponse,
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
};
