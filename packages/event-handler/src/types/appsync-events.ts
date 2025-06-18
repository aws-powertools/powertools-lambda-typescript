import type { Context } from 'aws-lambda';
import type { AppSyncEventsResolver } from '../appsync-events/AppSyncEventsResolver.js';
import type { RouteHandlerRegistry } from '../appsync-events/RouteHandlerRegistry.js';
import type { Router } from '../appsync-events/Router.js';
import type { Anything, GenericLogger } from './common.js';

// #region resolve options

/**
 * Optional object to pass to the {@link AppSyncEventsResolver.resolve | `AppSyncEventsResolver.resolve()`} method.
 */
type ResolveOptions = {
  /**
   * Reference to `this` instance of the class that is calling the `resolve` method.
   *
   * This parameter should be used only when using {@link AppSyncEventsResolver.onPublish | `AppSyncEventsResolver.onPublish()`}
   * and {@link AppSyncEventsResolver.onSubscribe | `AppSyncEventsResolver.onSubscribe()`} as class method decorators, and
   * it's used to bind the decorated methods to your class instance.
   *
   * @example
   * ```ts
   * import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
   *
   * const app = new AppSyncEventsResolver();
   *
   * class Lambda {
   *   public scope = 'scoped';
   *
   *   ⁣@app.onPublish('/foo')
   *   public async handleFoo(payload: string) {
   *     return `${this.scope} ${payload}`;
   *   }
   *
   *   public async handler(event: unknown, context: Context) {
   *     return app.resolve(event, context, { scope: this });
   *   }
   * }
   * const lambda = new Lambda();
   * const handler = lambda.handler.bind(lambda);
   * ```
   */
  scope?: unknown;
};

// #region OnPublish fn

type OnPublishHandlerFn = (
  payload: Anything,
  event: AppSyncEventsPublishEvent,
  context: Context
) => Promise<unknown>;

type OnPublishHandlerSyncFn = (
  payload: Anything,
  event: AppSyncEventsPublishEvent,
  context: Context
) => unknown;

type OnPublishAggregatePayload = Array<{
  payload: Anything;
  id: string;
}>;

type OnPublishHandlerAggregateFn = (
  events: OnPublishAggregatePayload,
  event: AppSyncEventsPublishEvent,
  context: Context
) => Promise<unknown[]>;

type OnPublishHandlerSyncAggregateFn = (
  events: Array<{
    payload: Anything;
    id: string;
  }>,
  event: AppSyncEventsPublishEvent,
  context: Context
) => unknown[];

type OnPublishAggregateOutput<T = unknown> = Array<{
  payload?: T;
  error?: string;
  id: string;
}>;

type OnPublishEventPayload<T = unknown> = {
  payload?: T;
  error?: string;
  id: string;
};

type OnPublishOutput<T = unknown> = {
  events: Array<OnPublishEventPayload<T>>;
};

/**
 * Handler type for onPublish events.
 *
 * @template T - Boolean indicating whether this is an aggregate handler
 * - When `true`, handler processes multiple events at once `(events[], event, context)`
 * - When `false` or `undefined`, handler processes one event at a time `(payload, event, context)`
 */
type OnPublishHandler<T extends boolean | undefined = undefined> =
  T extends true
    ? OnPublishHandlerAggregateFn | OnPublishHandlerSyncAggregateFn
    : OnPublishHandlerFn | OnPublishHandlerSyncFn;

// #region OnSubscribe fn

type OnSubscribeSyncHandlerFn = (
  event: AppSyncEventsSubscribeEvent,
  context: Context
) => unknown;

type OnSubscribeHandlerFn = (
  event: AppSyncEventsSubscribeEvent,
  context: Context
) => Promise<unknown>;

type OnSubscribeHandler = OnSubscribeSyncHandlerFn | OnSubscribeHandlerFn;

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
   * @default 'onPublish'
   */
  eventType?: 'onPublish' | 'onSubscribe';
};

/**
 * Options for registering a resolver event
 *
 * @property path - The path of the event to be registered
 * @property handler - The handler function to be called when the event is received
 * @property aggregate - Whether the route handler will send all the events to the route handler at once or one by one, default is `false`
 */
type RouteHandlerOptions<T extends boolean> = {
  /**
   * The handler function to be called when the event is received
   */
  handler: OnPublishHandler<T> | OnSubscribeHandler;
  /**
   * Whether the route handler will send all the events to the route handler at once or one by one
   * @default false
   */
  aggregate?: T;
  /**
   * The path of the event to be registered
   */
  path: string;
};

// #region Router

/**
 * Options for the {@link Router} class
 */
type RouterOptions = {
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
type RouteOptions<T extends boolean | undefined = false> = {
  /**
   * Whether the resolver will send all the events to the resolver at once or one by one
   * @default false
   */
  aggregate?: T;
};

// #region Events

/**
 * Event type for AppSync Events.
 *
 * For strongly typed validation and parsing at runtime, check out the `@aws-lambda-powertools/parser` package.
 */
type AppSyncEventsEvent = {
  /**
   * The `identity` field varies based on the authentication type used for the AppSync API.
   * When using an API key, it will be `null`. When using IAM, it will contain the AWS credentials of the user. When using Cognito,
   * it will contain the Cognito user pool information. When using a Lambda authorizer, it will contain the information returned
   * by the authorizer.
   */
  identity: null | Record<string, unknown>;
  result: null;
  request: {
    headers: Record<string, string>;
    domainName: null;
  };
  error: null;
  prev: null;
  stash: Record<string, unknown>;
  outErrors: unknown[];
  events: unknown;
  info: {
    channel: {
      path: string;
      segments: Array<string>;
    };
    channelNamespace: {
      name: string;
    };
    operation: 'PUBLISH' | 'SUBSCRIBE';
  };
};

/**
 * Event type for AppSync Events publish events.
 *
 * @example
 * ```json
 * {
 *   "identity": null,
 *   "result": null,
 *   "request": {
 *     "headers": {
 *       "header1": "value1",
 *     },
 *     "domainName": "example.com"
 *   },
 *   "info": {
 *     "channel": {
 *       "path": "/default/foo",
 *       "segments": ["default", "foo"]
 *     },
 *     "channelNamespace": {
 *       "name": "default"
 *     },
 *     "operation": "PUBLISH"
 *   },
 *   "error": null,
 *   "prev": null,
 *   "stash": {},
 *   "outErrors": [],
 *   "events": [
 *     {
 *       "payload": {
 *         "key": "value"
 *       },
 *       "id": "12345"
 *     },
 *     {
 *       "payload": {
 *         "key2": "value2"
 *       },
 *       "id": "67890"
 *     }
 *   ]
 * }
 *
 * For strongly typed validation and parsing at runtime, check out the `@aws-lambda-powertools/parser` package.
 *
 * ```
 */
type AppSyncEventsPublishEvent = AppSyncEventsEvent & {
  info: {
    operation: 'PUBLISH';
  };
  events: Array<{
    payload: unknown;
    id: string;
  }>;
};

/**
 * Event type for AppSync Events subscribe events.
 *
 * @example
 * ```json
 * {
 *   "identity": null,
 *   "result": null,
 *   "request": {
 *     "headers": {
 *       "header1": "value1",
 *     },
 *     "domainName": "example.com"
 *   },
 *   "info": {
 *     "channel": {
 *       "path": "/default/foo",
 *       "segments": ["default", "foo"]
 *     },
 *     "channelNamespace": {
 *       "name": "default"
 *     },
 *     "operation": "SUBSCRIBE"
 *   },
 *   "error": null,
 *   "prev": null,
 *   "stash": {},
 *   "outErrors": [],
 *   "events": null
 * }
 * ```
 *
 * For strongly typed validation and parsing at runtime, check out the `@aws-lambda-powertools/parser` package.
 */
type AppSyncEventsSubscribeEvent = AppSyncEventsEvent & {
  info: {
    operation: 'SUBSCRIBE';
  };
  events: null;
};

export type {
  GenericLogger,
  RouteHandlerRegistryOptions,
  RouteHandlerOptions,
  RouterOptions,
  RouteOptions,
  AppSyncEventsEvent,
  AppSyncEventsPublishEvent,
  AppSyncEventsSubscribeEvent,
  OnPublishHandler,
  OnPublishHandlerFn,
  OnPublishHandlerSyncFn,
  OnPublishHandlerSyncAggregateFn,
  OnPublishHandlerAggregateFn,
  OnPublishAggregatePayload,
  OnSubscribeHandler,
  OnPublishAggregateOutput,
  OnPublishEventPayload,
  OnPublishOutput,
  ResolveOptions,
};
