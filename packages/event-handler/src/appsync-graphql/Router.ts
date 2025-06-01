import {
  EnvironmentVariablesService,
  isRecord,
} from '@aws-lambda-powertools/commons';
import type {
  GenericLogger,
  GraphQlRouteOptions,
  GraphQlRouterOptions,
  OnMutationHandler,
  OnQueryHandler,
} from '../types/appsync-graphql.js';
import { RouteHandlerRegistry } from './RouteHandlerRegistry.js';

/**
 * Class for registering routes for the `query` and `mutation` events in AWS AppSync GraphQL APIs.
 */
class Router {
  /**
   * A map of registered routes for the `query` event, keyed by their fieldNames.
   */
  protected readonly onQueryRegistry: RouteHandlerRegistry;
  /**
   * A map of registered routes for the `mutation` event, keyed by their fieldNames.
   */
  protected readonly onMutationRegistry: RouteHandlerRegistry;
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
  /**
   * The environment variables service instance.
   */
  protected readonly envService: EnvironmentVariablesService;

  public constructor(options?: GraphQlRouterOptions) {
    this.envService = new EnvironmentVariablesService();
    const alcLogLevel = this.envService.get('AWS_LAMBDA_LOG_LEVEL');
    this.logger = options?.logger ?? {
      debug: alcLogLevel === 'DEBUG' ? console.debug : () => undefined,
      error: console.error,
      warn: console.warn,
    };
    this.onQueryRegistry = new RouteHandlerRegistry({
      logger: this.logger,
      eventType: 'onQuery',
    });
    this.onMutationRegistry = new RouteHandlerRegistry({
      logger: this.logger,
      eventType: 'onMutation',
    });
    this.isDev = this.envService.isDevMode();
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
   *   @app.onQuery('getPost')
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
   * @param options - Optional route options.
   * @param options.typeName - The name of the GraphQL type to use for the resolver (defaults to 'Query').
   */
  public onQuery(
    fieldName: string,
    handler: OnQueryHandler,
    options?: GraphQlRouteOptions
  ): void;
  public onQuery(
    fieldName: string,
    options?: GraphQlRouteOptions
  ): MethodDecorator;
  public onQuery(
    fieldName: string,
    handler?: OnQueryHandler | GraphQlRouteOptions,
    options?: GraphQlRouteOptions
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.onQueryRegistry.register({
        fieldName,
        handler,
        typeName: options?.typeName ?? 'Query',
      });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      const routeOptions = isRecord(handler) ? handler : options;
      this.onQueryRegistry.register({
        fieldName,
        handler: descriptor.value,
        typeName: routeOptions?.typeName ?? 'Query',
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
   *   @app.onMutation('createPost')
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
   * @param options - Optional route options.
   * @param options.typeName - The name of the GraphQL type to use for the resolver (defaults to 'Mutation').
   */
  public onMutation(
    fieldName: string,
    handler: OnMutationHandler,
    options?: GraphQlRouteOptions
  ): void;
  public onMutation(
    fieldName: string,
    options?: GraphQlRouteOptions
  ): MethodDecorator;
  public onMutation(
    fieldName: string,
    handler?: OnMutationHandler | GraphQlRouteOptions,
    options?: GraphQlRouteOptions
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.onMutationRegistry.register({
        fieldName,
        handler,
        typeName: options?.typeName ?? 'Mutation',
      });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      const routeOptions = isRecord(handler) ? handler : options;
      this.onMutationRegistry.register({
        fieldName,
        handler: descriptor.value,
        typeName: routeOptions?.typeName ?? 'Mutation',
      });
      return descriptor;
    };
  }
}

export { Router };
