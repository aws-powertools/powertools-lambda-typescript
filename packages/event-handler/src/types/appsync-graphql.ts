import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import type { ExceptionHandlerRegistry } from '../appsync-graphql/ExceptionHandlerRegistry.js';
import type { RouteHandlerRegistry } from '../appsync-graphql/RouteHandlerRegistry.js';
import type { Router } from '../appsync-graphql/Router.js';

// #region BatchResolver fn

type BatchResolverSyncHandlerFn<
  TParams = Record<string, unknown>,
  TSource = Record<string, unknown> | null,
> = (
  args: TParams,
  options: {
    event: AppSyncResolverEvent<TParams, TSource>;
    context: Context;
  }
) => unknown;

type BatchResolverHandlerFn<
  TParams = Record<string, unknown>,
  TSource = Record<string, unknown> | null,
> = (
  args: TParams,
  options: {
    event: AppSyncResolverEvent<TParams, TSource>;
    context: Context;
  }
) => Promise<unknown>;

type BatchResolverAggregateHandlerFn<
  TParams = Record<string, unknown>,
  TSource = Record<string, unknown> | null,
> = (
  events: AppSyncResolverEvent<TParams, TSource>[],
  options: {
    event: AppSyncResolverEvent<TParams, TSource>[];
    context: Context;
  }
) => Promise<unknown>;

type BatchResolverSyncAggregateHandlerFn<
  TParams = Record<string, unknown>,
  TSource = Record<string, unknown> | null,
> = (
  events: AppSyncResolverEvent<TParams, TSource>[],
  options: {
    event: AppSyncResolverEvent<TParams, TSource>[];
    context: Context;
  }
) => unknown;

type BatchResolverHandler<
  TParams = Record<string, unknown>,
  TSource = Record<string, unknown> | null,
  T extends boolean | undefined = undefined,
> = T extends true
  ?
      | BatchResolverAggregateHandlerFn<TParams, TSource>
      | BatchResolverSyncAggregateHandlerFn<TParams, TSource>
  :
      | BatchResolverHandlerFn<TParams, TSource>
      | BatchResolverSyncHandlerFn<TParams, TSource>;
//#endregion

// #region Resolver fn

type ResolverSyncHandlerFn<TParams = Record<string, unknown>> = (
  args: TParams,
  options: {
    event: AppSyncResolverEvent<TParams>;
    context: Context;
  }
) => unknown;

type ResolverHandlerFn<TParams = Record<string, unknown>> = (
  args: TParams,
  options: {
    event: AppSyncResolverEvent<TParams>;
    context: Context;
  }
) => Promise<unknown>;

type ResolverHandler<TParams = Record<string, unknown>> =
  | ResolverSyncHandlerFn<TParams>
  | ResolverHandlerFn<TParams>;

//#endregion

// #region Resolver registry

/**
 * Options for the {@link RouteHandlerRegistry | `RouteHandlerRegistry`} class
 */
type RouteHandlerRegistryOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
};

/**
 * Options for registering a resolver event
 *
 * @property handler - The handler function to be called when the event is received
 * @property fieldName - The name of the field to be registered
 * @property typeName - The name of the type to be registered
 */
type RouteHandlerOptions<
  TParams,
  T extends boolean,
  R extends boolean,
  TSource = Record<string, unknown> | null,
> = {
  /**
   * The handler function to be called when the event is received
   */
  handler: BatchResolverHandler<TParams, TSource, T> | ResolverHandler<TParams>;
  /**
   * The field name of the event to be registered
   */
  fieldName: string;
  /**
   * The type name of the event to be registered
   */
  typeName: string;
  /**
   * Whether the route handler will send all the events to the route handler at once or one by one
   * @default true
   */
  aggregate?: T;
  /**
   * Whether to raise an error if the handler fails
   * @default false
   */
  throwOnError?: R;
};

//#endregion

// #region Router

/**
 * Options for the {@link Router | `Router`} class
 */
type GraphQlRouterOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger?: GenericLogger;
};

/**
 * Options for registering a route
 */
type GraphQlRouteOptions = {
  /**
   * The name of the field to be registered
   */
  fieldName: string;
  /**
   * The type name of the event to be registered, i.e. `Query`, `Mutation`, or a custom type
   */
  typeName?: string;
};

/**
 * Options for configuring a batch GraphQL route handler.
 *
 * @template T - If `true`, the handler receives all events at once and `throwOnError` cannot be specified.
 *               If `false`, the handler is called for each event individually and `throwOnError` can be specified.
 *               Defaults to `true`.
 * @template R - If `true`, errors thrown by the handler will be raised. Defaults to `false`.
 */
type GraphQlBatchRouteOptions<
  T extends boolean | undefined = true,
  R extends boolean | undefined = false,
> = GraphQlRouteOptions &
  (T extends true
    ? { aggregate?: T; throwOnError?: never }
    : { aggregate?: T; throwOnError?: R });

//#endregion

// #region Exception handling

type ExceptionSyncHandlerFn<T extends Error> = (error: T) => unknown;

type ExceptionHandlerFn<T extends Error> = (error: T) => Promise<unknown>;

type ExceptionHandler<T extends Error = Error> =
  | ExceptionSyncHandlerFn<T>
  | ExceptionHandlerFn<T>;

// biome-ignore lint/suspicious/noExplicitAny: this is a generic type that is intentionally open
type ErrorClass<T extends Error> = new (...args: any[]) => T;

/**
 * Options for handling exceptions in the event handler.
 *
 * @template T - The type of error that extends the base Error class
 */
type ExceptionHandlerOptions<T extends Error = Error> = {
  /**
   * The error class to handle (must be Error or a subclass)
   */
  error: ErrorClass<T> | ErrorClass<T>[];
  /**
   * The handler function to be called when the error is caught
   */
  handler: ExceptionHandler<T>;
};

/**
 * Options for the {@link ExceptionHandlerRegistry | `ExceptionHandlerRegistry`} class
 */
type ExceptionHandlerRegistryOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
};

//#endregion

export type {
  RouteHandlerRegistryOptions,
  RouteHandlerOptions,
  GraphQlRouterOptions,
  GraphQlRouteOptions,
  GraphQlBatchRouteOptions,
  ResolverHandler,
  BatchResolverHandler,
  BatchResolverHandlerFn,
  BatchResolverAggregateHandlerFn,
  ExceptionHandler,
  ErrorClass,
  ExceptionHandlerOptions,
  ExceptionHandlerRegistryOptions,
};
