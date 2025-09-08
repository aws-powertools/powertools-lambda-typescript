import type {
  GenericLogger,
  JSONObject,
} from '@aws-lambda-powertools/commons/types';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import type { BaseRouter } from '../rest/BaseRouter.js';
import type { HttpErrorCodes, HttpVerbs } from '../rest/constants.js';
import type { Route } from '../rest/Route.js';
import type { ResolveOptions } from './common.js';

type ErrorResponse = {
  statusCode: HttpStatusCode;
  error: string;
  message: string;
};

type HandlerOptions = {
  request: Request;
  event: APIGatewayProxyEvent;
  context: Context;
  res: Response;
};

type ErrorResolveOptions = HandlerOptions & ResolveOptions;

type ErrorHandler<T extends Error = Error> = (
  error: T,
  options: HandlerOptions
) => Promise<ErrorResponse>;

interface ErrorConstructor<T extends Error = Error> {
  new (...args: any[]): T;
  prototype: T;
}

/**
 * Options for the {@link BaseRouter} class
 */
type RouterOptions = {
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
> = (args: TParams, options: HandlerOptions) => Promise<TReturn>;

type HttpMethod = keyof typeof HttpVerbs;

type HttpStatusCode = (typeof HttpErrorCodes)[keyof typeof HttpErrorCodes];

type Path = `/${string}`;

type RouteHandlerOptions = {
  handler: RouteHandler;
  params: Record<string, string>;
  rawParams: Record<string, string>;
  middleware: Middleware[];
};

type RouteOptions = {
  method: HttpMethod | HttpMethod[];
  path: Path;
  middleware?: Middleware[];
};

type NextFunction = () => Promise<HandlerResponse | void>;

type Middleware = (
  params: Record<string, string>,
  options: HandlerOptions,
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

export type {
  CompiledRoute,
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
  HandlerOptions,
  RouterOptions,
  RouteHandler,
  RouteOptions,
  RouteHandlerOptions,
  RouteRegistryOptions,
  ValidationResult,
};
