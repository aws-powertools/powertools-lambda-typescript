import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import type { RouteHandlerRegistry } from '../appsync-graphql/RouteHandlerRegistry.js';
import type { Router } from '../appsync-graphql/Router.js';

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
type RouteHandlerOptions<TParams = Record<string, unknown>> = {
  /**
   * The handler function to be called when the event is received
   */
  handler: ResolverHandler<TParams>;
  /**
   * The field name of the event to be registered
   */
  fieldName: string;
  /**
   * The type name of the event to be registered
   */
  typeName: string;
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

export type {
  RouteHandlerRegistryOptions,
  RouteHandlerOptions,
  GraphQlRouterOptions,
  GraphQlRouteOptions,
  ResolverHandler,
};
