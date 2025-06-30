import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import type { AppSyncGraphQLResolver } from '../appsync-graphql/AppSyncGraphQLResolver.js';
import type { RouteHandlerRegistry } from '../appsync-graphql/RouteHandlerRegistry.js';
import type { GenericLogger } from './common.js';

// #region resolve options

/**
 * Optional object to pass to the {@link AppSyncGraphQLResolver.resolve | `AppSyncGraphQLResolver.resolve()`} method.
 */
type ResolveOptions = {
  /**
   * Reference to `this` instance of the class that is calling the `resolve` method.
   *
   * This parameter should be used when using {@link AppSyncGraphQLResolver.resolver | `AppSyncGraphQLResolver.resolver()`}
   * as class method decorators, and it's used to bind the decorated methods to your class instance.
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   public scope = 'scoped';
   *
   *   @app.resolver({ fieldName: 'getPost', typeName: 'Query' })
   *   public async handleGetPost({ id }) {
   *     // your business logic here
   *     return {
   *       id,
   *       title: `${this.scope} Post Title`,
   *     };
   *   }
   *
   *   public async handler(event, context) {
   *     return app.resolve(event, context, { scope: this });
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   */
  scope?: unknown;
};

// #region Resolver fn

type ResolverSyncHandlerFn<TParams = Record<string, unknown>> = (
  args: TParams,
  event: AppSyncResolverEvent<TParams>,
  context: Context
) => unknown;

type ResolverHandlerFn<TParams = Record<string, unknown>> = (
  args: TParams,
  event: AppSyncResolverEvent<TParams>,
  context: Context
) => Promise<unknown>;

type ResolverHandler<TParams = Record<string, unknown>> =
  | ResolverSyncHandlerFn<TParams>
  | ResolverHandlerFn<TParams>;

// #region Resolver registry

/**
 * Options for the {@link RouteHandlerRegistry} class
 */
type RouteHandlerRegistryOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger: GenericLogger;
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
 * Options for the {@link Router} class
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
   * The type name of the event to be registered
   */
  typeName?: string;
};

export type {
  GenericLogger,
  RouteHandlerRegistryOptions,
  RouteHandlerOptions,
  GraphQlRouterOptions,
  GraphQlRouteOptions,
  ResolverHandler,
  ResolveOptions,
};
