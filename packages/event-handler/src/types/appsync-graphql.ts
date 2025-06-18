import type { RouteHandlerRegistry } from '../appsync-graphql/RouteHandlerRegistry.js';
import type { GenericLogger } from './common.js';

// #region OnQuery fn

type OnQuerySyncHandlerFn<TParams extends Record<string, unknown>> = (
  args: TParams
) => unknown;

type OnQueryHandlerFn<TParams extends Record<string, unknown>> = (
  args: TParams
) => Promise<unknown>;

type OnQueryHandler<TParams extends Record<string, unknown>> =
  | OnQuerySyncHandlerFn<TParams>
  | OnQueryHandlerFn<TParams>;

// #region OnMutation fn

type OnMutationSyncHandlerFn<TParams extends Record<string, unknown>> = (
  args: TParams
) => unknown;

type OnMutationHandlerFn<TParams extends Record<string, unknown>> = (
  args: TParams
) => Promise<unknown>;

type OnMutationHandler<TParams extends Record<string, unknown>> =
  | OnMutationSyncHandlerFn<TParams>
  | OnMutationHandlerFn<TParams>;

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
  /**
   * Event type stored in the registry
   * @default 'onQuery'
   */
  eventType?: 'onQuery' | 'onMutation';
};

/**
 * Options for registering a resolver event
 *
 * @property handler - The handler function to be called when the event is received
 * @property fieldName - The name of the field to be registered
 * @property typeName - The name of the type to be registered
 */
type RouteHandlerOptions = {
  /**
   * The handler function to be called when the event is received
   */
  handler:
    | OnQueryHandler<Record<string, unknown>>
    | OnMutationHandler<Record<string, unknown>>;
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
   * The type name of the event to be registered
   */
  typeName?: string;
};

// #region Events

/**
 * Event type for AppSync GraphQL.
 *
 * https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference.html
 *
 * For strongly typed validation and parsing at runtime, check out the `@aws-lambda-powertools/parser` package.
 */
type AppSyncGraphQLEvent = {
  arguments: Record<string, unknown>;
  /**
   * The `identity` field varies based on the authentication type used for the AppSync API.
   * When using an API key, it will be `null`. When using IAM, it will contain the AWS credentials of the user. When using Cognito,
   * it will contain the Cognito user pool information. When using a Lambda authorizer, it will contain the information returned
   * by the authorizer.
   */
  identity: null | Record<string, unknown>;
  source: null | Record<string, unknown>;
  request: {
    headers: Record<string, string>;
    domainName: null;
  };
  prev: null;
  info: {
    fieldName: string;
    selectionSetList: string[];
    parentTypeName: string;
  };
  stash: Record<string, unknown>;
};

export type {
  GenericLogger,
  RouteHandlerRegistryOptions,
  RouteHandlerOptions,
  GraphQlRouterOptions,
  GraphQlRouteOptions,
  AppSyncGraphQLEvent,
  OnQueryHandler,
  OnMutationHandler,
};
