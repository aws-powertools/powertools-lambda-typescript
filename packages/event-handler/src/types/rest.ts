import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { BaseRouter } from '../rest/BaseRouter.js';
import type { HttpErrorCodes, HttpVerbs } from '../rest/constants.js';
import type { Route } from '../rest/Route.js';

type ErrorResponse = {
  statusCode: HttpStatusCode;
  error: string;
  message: string;
};

interface ErrorContext {
  path: string;
  method: string;
  headers: Record<string, string>;
  timestamp: string;
  requestId?: string;
}

type ErrorHandler<T extends Error = Error> = (
  error: T,
  context?: ErrorContext
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

// biome-ignore lint/suspicious/noExplicitAny: we want to keep arguments and return types as any to accept any type of function
type RouteHandler<T = any, R = any> = (...args: T[]) => R;

type HttpMethod = keyof typeof HttpVerbs;

type HttpStatusCode = (typeof HttpErrorCodes)[keyof typeof HttpErrorCodes];

type Path = `/${string}`;

type RouteHandlerOptions = {
  handler: RouteHandler;
  params: Record<string, string>;
  rawParams: Record<string, string>;
};

type RouteOptions = {
  method: HttpMethod | HttpMethod[];
  path: Path;
};

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
  HttpStatusCode,
  HttpMethod,
  Path,
  RouterOptions,
  RouteHandler,
  RouteOptions,
  RouteHandlerOptions,
  RouteRegistryOptions,
  ValidationResult,
};
