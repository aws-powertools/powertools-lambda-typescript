import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import {
  getStringFromEnv,
  isDevMode,
} from '@aws-lambda-powertools/commons/utils/env';
import type {
  BatchResolverHandler,
  ErrorClass,
  ExceptionHandler,
  GraphQlBatchRouteOptions,
  GraphQlRouteOptions,
  GraphQlRouterOptions,
  ResolverHandler,
} from '../types/appsync-graphql.js';
import { ExceptionHandlerRegistry } from './ExceptionHandlerRegistry.js';
import { RouteHandlerRegistry } from './RouteHandlerRegistry.js';

/**
 * Class for registering resolvers for GraphQL events in AWS AppSync GraphQL APIs.
 */
class Router {
  /**
   * A map of registered routes for all GraphQL events, keyed by their fieldNames.
   */
  protected readonly resolverRegistry: RouteHandlerRegistry;
  /**
   * A map of registered routes for GraphQL batch events, keyed by their fieldNames.
   */
  protected readonly batchResolverRegistry: RouteHandlerRegistry;
  /**
   * A map of registered exception handlers for handling errors in GraphQL resolvers.
   */
  protected readonly exceptionHandlerRegistry: ExceptionHandlerRegistry;
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  protected readonly logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
  /**
   * Whether the router is running in development mode.
   */
  protected readonly isDev: boolean = false;

  public constructor(options?: GraphQlRouterOptions) {
    const alcLogLevel = getStringFromEnv({
      key: 'AWS_LAMBDA_LOG_LEVEL',
      defaultValue: '',
    });
    this.logger = options?.logger ?? {
      debug: alcLogLevel === 'DEBUG' ? console.debug : () => undefined,
      error: console.error,
      warn: console.warn,
    };
    this.resolverRegistry = new RouteHandlerRegistry({
      logger: this.logger,
    });
    this.batchResolverRegistry = new RouteHandlerRegistry({
      logger: this.logger,
    });
    this.exceptionHandlerRegistry = new ExceptionHandlerRegistry({
      logger: this.logger,
    });
    this.isDev = isDevMode();
  }

  /**
   * Register a resolver function for any GraphQL event.
   *
   * Registers a handler for a specific GraphQL field. The handler will be invoked when a request is made
   * for the specified field.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * // Register a Query resolver
   * app.resolver(async (payload) => {
   *   // your business logic here
   *   return payload;
   * }, {
   *   fieldName: 'getPost'
   * });
   *
   * // Register a Mutation resolver
   * app.resolver(async (payload) => {
   *   // your business logic here
   *   return payload;
   * }, {
   *   fieldName: 'createPost',
   *   typeName: 'Mutation'
   * });
   *
   * // Register a batch resolver
   * app.batchResolver<{ id: number }>(async (events) => {
   *   return events.map(event => ({ id: event.arguments.id, data: 'processed' }));
   * }, {
   *   fieldName: 'getPosts',
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * You can also specify the type of the arguments using a generic type parameter:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.resolver<{ postId: string }>(async ({ postId }) => {
   *   // postId is now typed as string
   *   return { id: postId };
   * }, {
   *   fieldName: 'getPost'
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * As a decorator:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   * import type { AppSyncResolverEvent } from 'aws-lambda';
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.resolver({ fieldName: 'getPost' })
   *   async handleGetPost(payload) {
   *     // your business logic here
   *     return payload;
   *   }
   *
   *   @app.batchResolver({ fieldName: 'getPosts' })
   *   async handleGetPosts(events: AppSyncResolverEvent<{ id: number }>[]) {
   *    // Process batch of events
   *    return events.map(event => ({ id: event.arguments.id, data: 'processed' }));
   *   }
   *
   *   async handler(event, context) {
   *     return app.resolve(event, context, {
   *       scope: this, // bind decorated methods to the class instance
   *     });
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   *
   * @param handler - The handler function to be called when the event is received.
   * @param options - Route options including the required fieldName and optional typeName.
   * @param options.fieldName - The name of the field to register the handler for.
   * @param options.typeName - The name of the GraphQL type to use for the resolver, defaults to `Query`.
   */
  public resolver<TParams extends Record<string, unknown>>(
    handler: ResolverHandler<TParams>,
    options: GraphQlRouteOptions
  ): void;
  public resolver(options: GraphQlRouteOptions): MethodDecorator;
  public resolver<TParams extends Record<string, unknown>>(
    handlerOrOptions: ResolverHandler<TParams> | GraphQlRouteOptions,
    options?: GraphQlRouteOptions
  ): MethodDecorator | undefined {
    if (typeof handlerOrOptions === 'function') {
      const resolverOptions = options as GraphQlRouteOptions;
      const { typeName = 'Query', fieldName } = resolverOptions;

      this.resolverRegistry.register({
        fieldName,
        handler: handlerOrOptions as ResolverHandler,
        typeName,
      });

      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.resolverRegistry.register({
        fieldName: handlerOrOptions.fieldName,
        handler: descriptor?.value,
        typeName: handlerOrOptions.typeName ?? 'Query',
      });

      return descriptor;
    };
  }

  /**
   * Register a handler function for the `query` event.
   
    * Registers a handler for a specific GraphQL Query field. The handler will be invoked when a request is made
    * for the specified field in the Query type.
    *
    * @example
    * ```ts
    * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
    *
    * const app = new AppSyncGraphQLResolver();
    *
    * app.onQuery('getPost', async (payload) => {
    *   // your business logic here
    *   return payload;
    * });
    
    * export const handler = async (event, context) =>
    *   app.resolve(event, context);
    * ```
    *
    * As a decorator:
    *
    * @example
    * ```ts
    * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
    *
    * const app = new AppSyncGraphQLResolver();
    *
    * class Lambda {
    *   ⁣@app.onQuery('getPost')
    *   async handleGetPost(payload) {
    *     // your business logic here
    *     return payload;
    *   }
    *
    *   async handler(event, context) {
    *     return app.resolve(event, context);
    *   }
    * }
    *
    * const lambda = new Lambda();
    * export const handler = lambda.handler.bind(lambda);
    * ```
    *
    * @param fieldName - The name of the Query field to register the handler for.
    * @param handler - The handler function to be called when the event is received.
    */
  public onQuery<TParams extends Record<string, unknown>>(
    fieldName: string,
    handler: ResolverHandler<TParams>
  ): void;
  public onQuery(fieldName: string): MethodDecorator;
  public onQuery<TParams extends Record<string, unknown>>(
    fieldName: string,
    handlerOrFieldName?:
      | ResolverHandler<TParams>
      | Pick<GraphQlRouteOptions, 'fieldName'>
  ): MethodDecorator | undefined {
    if (typeof handlerOrFieldName === 'function') {
      this.resolverRegistry.register({
        fieldName: fieldName,
        handler: handlerOrFieldName as ResolverHandler,
        typeName: 'Query',
      });

      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.resolverRegistry.register({
        fieldName: fieldName,
        handler: descriptor?.value,
        typeName: 'Query',
      });

      return descriptor;
    };
  }

  /**
   * Register a handler function for the `mutation` event.
   *
   * Registers a handler for a specific GraphQL Mutation field. The handler will be invoked when a request is made
   * for the specified field in the Mutation type.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.onMutation('createPost', async (payload) => {
   *   // your business logic here
   *   return payload;
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * As a decorator:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.onMutation('createPost')
   *   async handleCreatePost(payload) {
   *     // your business logic here
   *     return payload;
   *   }
   *
   *   async handler(event, context) {
   *     return app.resolve(event, context);
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   *
   * @param fieldName - The name of the Mutation field to register the handler for.
   * @param handler - The handler function to be called when the event is received.
   */
  public onMutation<TParams extends Record<string, unknown>>(
    fieldName: string,
    handler: ResolverHandler<TParams>
  ): void;
  public onMutation(fieldName: string): MethodDecorator;
  public onMutation<TParams extends Record<string, unknown>>(
    fieldName: string,
    handlerOrFieldName?: ResolverHandler<TParams> | string
  ): MethodDecorator | undefined {
    if (typeof handlerOrFieldName === 'function') {
      this.resolverRegistry.register({
        fieldName,
        handler: handlerOrFieldName as ResolverHandler,
        typeName: 'Mutation',
      });

      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.resolverRegistry.register({
        fieldName,
        handler: descriptor?.value,
        typeName: 'Mutation',
      });

      return descriptor;
    };
  }

  /**
   * Register a batch resolver function for GraphQL events that support batching.
   *
   * Registers a handler for a specific GraphQL field that can process multiple requests in a batch.
   * The handler will be invoked when requests are made for the specified field, and can either
   * process requests individually or aggregate them for batch processing.
   *
   * By default, the handler will receive all batch events at once as an array and you are responsible for processing
   * them and returning an array of results. The first parameter is an array of events, while the second parameter
   * provides the original event array and context.
   *
   * If your function throws an error, we catch it and format the error response to be sent back to AppSync. This helps
   * the client understand what went wrong and handle the error accordingly.
   *
   * It's important to note that if your function throws an error when processing in aggregate mode, the entire
   * batch of events will be affected.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.batchResolver<{id: number}>(async (events) => {
   *   // Process all events in batch
   *   return events.map(event => ({ id: event.arguments.id, data: 'processed' }));
   * }, {
   *   fieldName: 'getPosts'
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * **Process events individually**
   *
   * If you want to process each event individually instead of receiving all events at once, you can set the
   * `aggregate` option to `false`. In this case, the handler will be called once for each event in the batch,
   * similar to regular resolvers.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.batchResolver(async (args, { event, context }) => {
   *   // Process individual request
   *   return { id: args.id, data: 'processed' };
   * }, {
   *   fieldName: 'getPost',
   *   aggregate: false
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * When the handler is called, the first parameter contains the arguments from the GraphQL request, while the second
   * parameter provides the original event and context, similar to regular resolvers.
   *
   * When `aggregate` is `false`, by default if one of the events in the batch throws an error, we catch it
   * and append `null` for that specific event in the results array, allowing other events to be processed successfully.
   * This provides graceful error handling where partial failures don't affect the entire batch.
   *
   * **Strict error handling**
   *
   * If you want stricter error handling when processing events individually, you can set the `throwOnError` option
   * to `true`. In this case, if any event throws an error, the entire batch processing will stop and the error
   * will be propagated. Note that `throwOnError` can only be used when `aggregate` is set to `false`.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.batchResolver(async (args, { event, context }) => {
   *   // Process individual request
   *   return { id: args.id, data: 'processed' };
   * }, {
   *   fieldName: 'getPost',
   *   aggregate: false,
   *   throwOnError: true
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * You can also specify the type of the arguments using generic type parameters for non-aggregated handlers:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver()
   *
   * app.batchResolver<{ postId: string }>(async (args, { event, context }) => {
   *   // args is typed as { postId: string }
   *   return { id: args.postId };
   * }, {
   *   fieldName: 'getPost',
   *   aggregate: false
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * As a decorator:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.batchResolver({ fieldName: 'getPosts' })
   *   async handleGetPosts(events) {
   *     // Process batch of events
   *     return events.map(event => ({ id: event.arguments.id, data: 'processed' }));
   *   }
   *
   *   ⁣@app.batchResolver({ fieldName: 'getPost', aggregate: false })
   *   async handleGetPost(args, { event, context }) {
   *     // Process individual request
   *     return { id: args.id, data: 'processed' };
   *   }
   *
   *   ⁣@app.batchResolver({ fieldName: 'getPost', aggregate: false, throwOnError: true })
   *   async handleGetPostStrict(args, { event, context }) {
   *     // Process individual request with strict error handling
   *     return { id: args.id, data: 'processed' };
   *   }
   *
   *   async handler(event, context) {
   *     return app.resolve(event, context, {
   *       scope: this, // bind decorated methods to the class instance
   *     });
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   *
   * @param handler - The batch handler function to be called when events are received.
   * @param options - Batch route options including the required fieldName and optional configuration.
   * @param options.fieldName - The name of the field to register the handler for.
   * @param options.typeName - The name of the GraphQL type to use for the resolver, defaults to `Query`.
   * @param options.aggregate - Whether to aggregate multiple requests into a single handler call, defaults to `true`.
   * @param options.throwOnError - Whether to raise errors when processing individual requests (only available when aggregate is false), defaults to `false`.
   */
  public batchResolver<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
  >(
    handler: BatchResolverHandler<TParams, TSource, true>,
    options: GraphQlBatchRouteOptions<true, boolean>
  ): void;
  public batchResolver<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
  >(
    handler: BatchResolverHandler<TParams, TSource, false>,
    options: GraphQlBatchRouteOptions<false, boolean>
  ): void;
  public batchResolver<T extends boolean = true, R extends boolean = false>(
    options: GraphQlBatchRouteOptions<T, R>
  ): MethodDecorator;
  public batchResolver<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
    T extends boolean = true,
    R extends boolean = false,
  >(
    handler:
      | BatchResolverHandler<TParams, TSource, T>
      | GraphQlBatchRouteOptions<T, R>,
    options?: GraphQlBatchRouteOptions<T, R>
  ): MethodDecorator | undefined {
    if (typeof handler === 'function') {
      const batchResolverOptions = options as GraphQlBatchRouteOptions;
      const { typeName = 'Query', fieldName } = batchResolverOptions;
      this.batchResolverRegistry.register({
        fieldName,
        handler: handler as BatchResolverHandler,
        typeName,
        aggregate: batchResolverOptions?.aggregate,
        throwOnError: batchResolverOptions?.throwOnError,
      });
      return;
    }

    const batchResolverOptions = handler;
    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      const { typeName = 'Query', fieldName } = batchResolverOptions;
      this.batchResolverRegistry.register({
        fieldName,
        handler: descriptor?.value,
        typeName,
        aggregate: batchResolverOptions?.aggregate,
        throwOnError: batchResolverOptions?.throwOnError,
      });
      return descriptor;
    };
  }

  /**
   * Register a batch handler function for the `query` event.
   *
   * Registers a batch handler for a specific GraphQL Query field that can process multiple requests in a batch.
   * The handler will be invoked when requests are made for the specified field in the Query type.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';

   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.onBatchQuery<{ id: number }>('getPosts', async (events) => {
   *   // Process all events in batch
   *   return events.map(event => ({ id: event.arguments.id, data: 'processed' }));
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * By default, the handler will receive all batch events at once as an array and you are responsible for processing
   * them and returning an array of results. The first parameter is an array of events, while the second parameter
   * provides the original event array and context.
   *
   * If your function throws an error, we catch it and format the error response to be sent back to AppSync. This helps
   * the client understand what went wrong and handle the error accordingly.
   *
   * It's important to note that if your function throws an error when processing in aggregate mode, the entire
   * batch of events will be affected.
   *
   * **Process events individually**
   *
   * If you want to process each event individually instead of receiving all events at once, you can set the
   * `aggregate` option to `false`. In this case, the handler will be called once for each event in the batch,
   * similar to regular resolvers.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.onBatchQuery('getPost', async (args, { event, context }) => {
   *   // Process individual request
   *   return { id: args.id, data: 'processed' };
   * }, { aggregate: false });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * When the handler is called, the first parameter contains the arguments from the GraphQL request, while the second
   * parameter provides the original event and context, similar to regular resolvers.
   *
   * When `aggregate` is `false`, by default if one of the events in the batch throws an error, we catch it
   * and append `null` for that specific event in the results array, allowing other events to be processed successfully.
   * This provides graceful error handling where partial failures don't affect the entire batch.
   *
   * **Strict error handling**
   *
   * If you want stricter error handling when processing events individually, you can set the `throwOnError` option
   * to `true`. In this case, if any event throws an error, the entire batch processing will stop and the error
   * will be propagated. Note that `throwOnError` can only be used when `aggregate` is set to `false`.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.onBatchQuery('getPost', async (args, { event, context }) => {
   *   // Process individual request
   *   return { id: args.id, data: 'processed' };
   * }, { aggregate: false, throwOnError: true });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * As a decorator:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   * import type { AppSyncResolverEvent } from 'aws-lambda';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.onBatchQuery('getPosts')
   *   async handleGetPosts(events: AppSyncResolverEvent<{ id: number }>[]) {
   *     // Process batch of events
   *     return events.map(event => ({ id: event.arguments.id, data: 'processed' }));
   *   }
   *
   *   ⁣@app.onBatchQuery('getPost', { aggregate: false })
   *   async handleGetPost(args, { event, context }) {
   *     // Process individual request
   *     return { id: args.id, data: 'processed' };
   *   }
   *
   *   ⁣@app.onBatchQuery('getPost', { aggregate: false, throwOnError: true })
   *   async handleGetPostStrict(args, { event, context }) {
   *     // Process individual request with strict error handling
   *     return { id: args.id, data: 'processed' };
   *   }
   *
   *   async handler(event, context) {
   *     return app.resolve(event, context, {
   *       scope: this, // bind decorated methods to the class instance
   *     });
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   *
   * @param fieldName - The name of the Query field to register the batch handler for.
   * @param handler - The batch handler function to be called when events are received.
   * @param options - Optional batch configuration including aggregate and throwOnError settings.
   * @param options.aggregate - Whether to aggregate multiple requests into a single handler call, defaults to `true`.
   * @param options.throwOnError - Whether to raise errors when processing individual requests (only available when aggregate is false), defaults to `false`.
   */
  public onBatchQuery<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
  >(
    fieldName: string,
    handler: BatchResolverHandler<TParams, TSource, true>,
    options?: Omit<
      GraphQlBatchRouteOptions<true, boolean>,
      'fieldName' | 'typeName'
    >
  ): void;
  public onBatchQuery<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
  >(
    fieldName: string,
    handler: BatchResolverHandler<TParams, TSource, false>,
    options?: Omit<
      GraphQlBatchRouteOptions<false, boolean>,
      'fieldName' | 'typeName'
    >
  ): void;
  public onBatchQuery(
    fieldName: string,
    options: Omit<
      GraphQlBatchRouteOptions<false, boolean>,
      'fieldName' | 'typeName'
    >
  ): MethodDecorator;
  public onBatchQuery(
    fieldName: string,
    options?: Omit<
      GraphQlBatchRouteOptions<true, boolean>,
      'fieldName' | 'typeName'
    >
  ): MethodDecorator;
  public onBatchQuery<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
    T extends boolean = true,
    R extends boolean = false,
  >(
    fieldName: string,
    handlerOrOptions?:
      | BatchResolverHandler<TParams, TSource, T>
      | Omit<GraphQlBatchRouteOptions<T, R>, 'fieldName' | 'typeName'>,
    options?: Omit<GraphQlBatchRouteOptions<T, R>, 'fieldName' | 'typeName'>
  ): MethodDecorator | undefined {
    if (typeof handlerOrOptions === 'function') {
      this.batchResolverRegistry.register({
        fieldName,
        handler: handlerOrOptions as BatchResolverHandler,
        typeName: 'Query',
        aggregate: options?.aggregate,
        throwOnError: options?.throwOnError,
      });

      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.batchResolverRegistry.register({
        fieldName,
        handler: descriptor?.value,
        typeName: 'Query',
        aggregate: handlerOrOptions?.aggregate,
        throwOnError: handlerOrOptions?.throwOnError,
      });

      return descriptor;
    };
  }

  /**
   * Register a batch handler function for the `mutation` event.
   *
   * Registers a batch handler for a specific GraphQL Mutation field that can process multiple requests in a batch.
   * The handler will be invoked when requests are made for the specified field in the Mutation type.
   *
   * By default, the handler will receive all batch events at once as an array and you are responsible for processing
   * them and returning an array of results. The first parameter is an array of events, while the second parameter
   * provides the original event array and context.
   *
   * If your function throws an error, we catch it and format the error response to be sent back to AppSync.
   *
   * It's important to note that if your function throws an error when processing in aggregate mode, the entire
   * batch of events will be affected.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.onBatchMutation<{ id: number }>('createPosts', async (events) => {
   *   // Process all events in batch
   *   return events.map(event => ({ id: event.arguments.id, status: 'created' }));
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * **Process events individually**
   *
   * If you want to process each event individually instead of receiving all events at once, you can set the
   * `aggregate` option to `false`. In this case, the handler will be called once for each event in the batch,
   * similar to regular resolvers.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.onBatchMutation('createPost', async (args, { event, context }) => {
   *   // Process individual request
   *   return { id: args.id, status: 'created' };
   * }, { aggregate: false });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * When the handler is called, the first parameter contains the arguments from the GraphQL request, while the second
   * parameter provides the original event and context, similar to regular resolvers.
   *
   * When `aggregate` is `false`, by default if one of the events in the batch throws an error, we catch it
   * and append `null` for that specific event in the results array, allowing other events to be processed successfully.
   * This provides graceful error handling where partial failures don't affect the entire batch.
   *
   * **Strict error handling**
   *
   * If you want stricter error handling when processing events individually, you can set the `throwOnError` option
   * to `true`. In this case, if any event throws an error, the entire batch processing will stop and the error
   * will be propagated. Note that `throwOnError` can only be used when `aggregate` is set to `false`.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.onBatchMutation('createPost', async (args, { event, context }) => {
   *   // Process individual request
   *   return { id: args.id, status: 'created' };
   * }, { aggregate: false, throwOnError: true });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * As a decorator:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   * import type { AppSyncResolverEvent } from 'aws-lambda';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.onBatchMutation('createPosts')
   *   async handleCreatePosts(events: AppSyncResolverEvent<{ id: number }>[]) {
   *     // Process batch of events
   *     return events.map(event => ({ id: event.arguments.id, status: 'created' }));
   *   }
   *
   *   ⁣@app.onBatchMutation('createPost', { aggregate: false })
   *   async handleCreatePost(args, { event, context }) {
   *     // Process individual request
   *     return { id: args.id, status: 'created' };
   *   }
   *
   *   ⁣@app.onBatchMutation('createPost', { aggregate: false, throwOnError: true })
   *   async handleCreatePostStrict(args, { event, context }) {
   *     // Process individual request with strict error handling
   *     return { id: args.id, status: 'created' };
   *   }
   *
   *   async handler(event, context) {
   *     return app.resolve(event, context, {
   *       scope: this, // bind decorated methods to the class instance
   *     });
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   *
   * @param fieldName - The name of the Mutation field to register the batch handler for.
   * @param handler - The batch handler function to be called when events are received.
   * @param options - Optional batch configuration including aggregate and throwOnError settings.
   * @param options.aggregate - Whether to aggregate multiple requests into a single handler call, defaults to `true`.
   * @param options.throwOnError - Whether to raise errors when processing individual requests (only available when aggregate is false), defaults to `false`.
   */
  public onBatchMutation<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
  >(
    fieldName: string,
    handler: BatchResolverHandler<TParams, TSource, true>,
    options?: Omit<
      GraphQlBatchRouteOptions<true, boolean>,
      'fieldName' | 'typeName'
    >
  ): void;
  public onBatchMutation<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
  >(
    fieldName: string,
    handler: BatchResolverHandler<TParams, TSource, false>,
    options?: Omit<
      GraphQlBatchRouteOptions<false, boolean>,
      'fieldName' | 'typeName'
    >
  ): void;
  public onBatchMutation(
    fieldName: string,
    options: Omit<
      GraphQlBatchRouteOptions<false, boolean>,
      'fieldName' | 'typeName'
    >
  ): MethodDecorator;
  public onBatchMutation(
    fieldName: string,
    options?: Omit<
      GraphQlBatchRouteOptions<true, boolean>,
      'fieldName' | 'typeName'
    >
  ): MethodDecorator;
  public onBatchMutation<
    TParams extends Record<string, unknown>,
    TSource = Record<string, unknown> | null,
    T extends boolean = true,
    R extends boolean = false,
  >(
    fieldName: string,
    handlerOrOptions?:
      | BatchResolverHandler<TParams, TSource, T>
      | Omit<GraphQlBatchRouteOptions<T, R>, 'fieldName' | 'typeName'>,
    options?: Omit<GraphQlBatchRouteOptions<T, R>, 'fieldName' | 'typeName'>
  ): MethodDecorator | undefined {
    if (typeof handlerOrOptions === 'function') {
      this.batchResolverRegistry.register({
        fieldName,
        handler: handlerOrOptions as BatchResolverHandler,
        typeName: 'Mutation',
        aggregate: options?.aggregate,
        throwOnError: options?.throwOnError,
      });

      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.batchResolverRegistry.register({
        fieldName,
        handler: descriptor?.value,
        typeName: 'Mutation',
        aggregate: handlerOrOptions?.aggregate,
        throwOnError: handlerOrOptions?.throwOnError,
      });

      return descriptor;
    };
  }

  /**
   * Register an exception handler for a specific error class.
   *
   * Registers a handler for a specific error class that can be thrown by GraphQL resolvers.
   * The handler will be invoked when an error of the specified class is thrown from any
   * resolver function.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   * import { AssertionError } from 'assert';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * // Register an exception handler for AssertionError
   * app.exceptionHandler(AssertionError, async (error) => {
   *   return {
   *     error: {
   *       message: error.message,
   *       type: error.name
   *     }
   *   };
   * });
   *
   * // Register a resolver that might throw an AssertionError
   * app.onQuery('createSomething', async () => {
   *   throw new AssertionError({
   *     message: 'This is an assertion Error',
   *   });
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * As a decorator:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   * import { AssertionError } from 'assert';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.exceptionHandler(AssertionError)
   *   async handleAssertionError(error: AssertionError) {
   *     return {
   *       error: {
   *         message: error.message,
   *         type: error.name
   *       }
   *     };
   *   }
   *
   *   ⁣@app.onQuery('getUser')
   *   async getUser() {
   *     throw new AssertionError({
   *       message: 'This is an assertion Error',
   *     });
   *   }
   *
   *   async handler(event, context) {
   *     return app.resolve(event, context, {
   *       scope: this, // bind decorated methods to the class instance
   *     });
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   *
   * @param error - The error class to handle.
   * @param handler - The handler function to be called when the error is caught.
   */
  public exceptionHandler<T extends Error>(
    error: ErrorClass<T> | ErrorClass<T>[],
    handler: ExceptionHandler<T>
  ): void;
  public exceptionHandler<T extends Error>(
    error: ErrorClass<T> | ErrorClass<T>[]
  ): MethodDecorator;
  public exceptionHandler<T extends Error>(
    error: ErrorClass<T> | ErrorClass<T>[],
    handler?: ExceptionHandler<T>
  ): MethodDecorator | undefined {
    if (typeof handler === 'function') {
      this.exceptionHandlerRegistry.register({
        error,
        handler: handler as ExceptionHandler<Error>,
      });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.exceptionHandlerRegistry.register({
        error,
        handler: descriptor?.value,
      });
      return descriptor;
    };
  }
}

export { Router };
