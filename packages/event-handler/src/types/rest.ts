import type { BaseRouter } from '../rest/BaseRouter.js';
import type { GenericLogger } from './appsync-events.js';

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

// biome-ignore lint/suspicious/noExplicitAny: we want to keep arguments and return types as any to accept any type of function
type RouteHandler<T = any, R = any> = (...args: T[]) => R;

type RouteOptions = {
  method?: string;
  path?: string;
};

export type { RouterOptions, RouteHandler, RouteOptions };
