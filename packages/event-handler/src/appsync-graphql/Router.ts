import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import {
  getStringFromEnv,
  isDevMode,
} from '@aws-lambda-powertools/commons/utils/env';
import type {
  GraphQlRouteOptions,
  GraphQlRouterOptions,
  ResolverHandler,
} from '../types/appsync-graphql.js';
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
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.resolver({ fieldName: 'getPost' })
   *   async handleGetPost(payload) {
   *     // your business logic here
   *     return payload;
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
}

export { Router };
