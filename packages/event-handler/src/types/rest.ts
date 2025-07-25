import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { BaseRouter } from '../rest/BaseRouter.js';
import type { HttpVerbs } from '../rest/constants.js';

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
  originalPath: string;
  regex: RegExp;
  paramNames: string[];
  isDynamic: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: we want to keep arguments and return types as any to accept any type of function
type RouteHandler<T = any, R = any> = (...args: T[]) => R;

type HttpMethod = keyof typeof HttpVerbs;

type Path = `/${string}`;

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

type ValidationResult = {
  isValid: boolean;
  issues: string[];
};

export type {
  CompiledRoute,
  HttpMethod,
  Path,
  RouterOptions,
  RouteHandler,
  RouteOptions,
  RouteRegistryOptions,
  ValidationResult,
};
