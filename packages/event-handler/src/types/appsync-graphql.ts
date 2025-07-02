import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import type { RouteHandlerRegistry } from '../appsync-graphql/RouteHandlerRegistry.js';
import type { Router } from '../appsync-graphql/Router.js';

// #region BatchResolver fn

type BatchResolverSyncHandlerFn<TParams = Record<string, unknown>> = (
  args: TParams,
  options: {
    event: AppSyncResolverEvent<TParams>;
    context: Context;
  }
) => unknown;

type BatchResolverHandlerFn<TParams = Record<string, unknown>> = (
  args: TParams,
  options: {
    event: AppSyncResolverEvent<TParams>;
    context: Context;
  }
) => Promise<unknown>;

type BatchResolverAggregateHandlerFn<TParams = Record<string, unknown>> = (
  events: AppSyncResolverEvent<TParams>[],
  options: {
    context: Context;
  }
) => Promise<unknown>;

type BatchResolverSyncAggregateHandlerFn<TParams = Record<string, unknown>> = (
  event: AppSyncResolverEvent<TParams>[],
  options: {
    context: Context;
  }
) => unknown;

type BatchResolverHandler<
  TParams = Record<string, unknown>,
  T extends boolean | undefined = undefined,
> = T extends true
  ?
      | BatchResolverAggregateHandlerFn<TParams>
      | BatchResolverSyncAggregateHandlerFn<TParams>
  : BatchResolverHandlerFn<TParams> | BatchResolverSyncHandlerFn<TParams>;

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
  TParams = Record<string, unknown>,
  T extends boolean = true,
  R extends boolean = false,
> = {
  /**
   * The handler function to be called when the event is received
   */
  handler: BatchResolverHandler<TParams, T> | ResolverHandler<TParams>;
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
  raiseOnError?: R;
};

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

type GraphQlBatchRouteOptions<
  T extends boolean = false,
  R extends boolean = true,
> = GraphQlRouteOptions & {
  /**
   * Whether the route handler will send all the events to the route handler at once or one by one
   * @default false
   */
  aggregate?: T;
  /**
   * Whether to raise an error if the handler fails
   * @default true
   */
  raiseOnError?: R;
};

export type {
  RouteHandlerRegistryOptions,
  RouteHandlerOptions,
  GraphQlRouterOptions,
  GraphQlRouteOptions,
  GraphQlBatchRouteOptions,
  ResolverHandler,
  BatchResolverHandler,
  BatchResolverAggregateHandlerFn,
};
