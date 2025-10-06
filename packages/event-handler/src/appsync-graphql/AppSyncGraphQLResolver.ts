import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import type {
  BatchResolverAggregateHandlerFn,
  BatchResolverHandlerFn,
  GraphQlRouterOptions,
  ResolverHandler,
  RouteHandlerOptions,
} from '../types/appsync-graphql.js';
import type { ResolveOptions } from '../types/common.js';
import {
  InvalidBatchResponseException,
  ResolverNotFoundException,
} from './errors.js';
import { Router } from './Router.js';
import { isAppSyncGraphQLEvent } from './utils.js';

/**
 * Resolver for AWS AppSync GraphQL APIs.
 *
 * This resolver is designed to handle GraphQL events from AWS AppSync GraphQL APIs. It allows you to register handlers for these events
 * and route them to the appropriate functions based on the event's field & type.
 *
 * @example
 * ```ts
 * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
 *
 * const app = new AppSyncGraphQLResolver();
 *
 * app.resolver(async ({ id }) => {
 *   // your business logic here
 *   return {
 *     id,
 *     title: 'Post Title',
 *     content: 'Post Content',
 *   };
 * }, {
 *   fieldName: 'getPost',
 *   typeName: 'Query'
 * });
 *
 * export const handler = async (event, context) =>
 *   app.resolve(event, context);
 * ```
 */
class AppSyncGraphQLResolver extends Router {
  /**
   * A map to hold shared contextual data accessible to all resolver handlers.
   */
  public readonly sharedContext: Map<string, unknown>;

  public constructor(options?: GraphQlRouterOptions) {
    super(options);
    this.sharedContext = new Map<string, unknown>();
  }

  /**
   * Resolve the response based on the provided event and route handlers configured.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.resolver(async ({ id }) => {
   *   // your business logic here
   *   return {
   *     id,
   *     title: 'Post Title',
   *     content: 'Post Content',
   *   };
   * }, {
   *   fieldName: 'getPost',
   *   typeName: 'Query'
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * Resolves the response based on the provided batch event and route handlers configured.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.batchResolver<{ id: number }>(async (events) => {
   *   // your business logic here
   *   const ids = events.map((event) => event.arguments.id);
   *   return ids.map((id) => ({
   *     id,
   *     title: 'Post Title',
   *     content: 'Post Content',
   *   }));
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * The method works also as class method decorator, so you can use it like this:
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.resolver({ fieldName: 'getPost', typeName: 'Query' })
   *   async handleGetPost({ id }) {
   *     // your business logic here
   *     return {
   *       id,
   *       title: 'Post Title',
   *       content: 'Post Content',
   *     };
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
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   * import type { AppSyncResolverEvent } from 'aws-lambda';
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * class Lambda {
   *   ⁣@app.batchResolver({ fieldName: 'getPosts', typeName: 'Query' })
   *   async getPosts(events: AppSyncResolverEvent<{ id: number }>[]) {
   *     // your business logic here
   *     const ids = events.map((event) => event.arguments.id);
   *     return ids.map((id) => ({
   *       id,
   *       title: 'Post Title',
   *       content: 'Post Content',
   *     }));
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
   * @param event - The incoming event, which may be an AppSync GraphQL event or an array of events.
   * @param context - The AWS Lambda context object.
   * @param options - Optional parameters for the resolver, such as the scope of the handler.
   */
  public resolve(event: unknown, context: Context, options?: ResolveOptions) {
    if (Array.isArray(event)) {
      if (event.some((e) => !isAppSyncGraphQLEvent(e))) {
        this.logger.warn(
          'Received a batch event that is not compatible with this resolver'
        );
        return;
      }

      try {
        return await this.#withErrorHandling(
          () => this.#executeBatchResolvers(event, context, options),
          event[0],
          options
        );
      } finally {
        /**
         * Clear shared context after batch processing for safety
         */
        this.sharedContext.clear();
      }
    }
    if (!isAppSyncGraphQLEvent(event)) {
      this.logger.warn(
        'Received an event that is not compatible with this resolver'
      );
      return;
    }

    try {
      return await this.#withErrorHandling(
        () => this.#executeSingleResolver(event, context, options),
        event,
        options
      );
    } finally {
      /**
       * Clear shared context after batch processing for safety
       */
      this.sharedContext.clear();
    }
  }

  /**
   * Includes one or more routers and merges their registries into the current resolver.
   *
   * This method allows you to compose multiple routers by merging their
   * route registries into the current AppSync GraphQL resolver instance.
   * All resolver handlers, batch resolver handlers, and exception handlers
   * from the included routers will be available in the current resolver.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver, Router } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const postRouter = new Router();
   * postRouter.onQuery('getPosts', async () => [{ id: 1, title: 'Post 1' }]);
   *
   * const userRouter = new Router();
   * userRouter.onQuery('getUsers', async () => [{ id: 1, name: 'John Doe' }]);
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.includeRouter([userRouter, postRouter]);
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * @param router - The router instance or array of router instances whose registries will be merged
   */
  public includeRouter(router: Router | Router[]): void {
    const routers = Array.isArray(router) ? router : [router];

    this.logger.debug('Including router');
    for (const routerToBeIncluded of routers) {
      this.mergeRegistriesFrom(routerToBeIncluded);
    }
    this.logger.debug('Router included successfully');
  }

  /**
   * Appends contextual data to be shared with all resolver handlers.
   *
   * This method allows you to add key-value pairs to the shared context that will be
   * accessible to all resolver handlers through the `sharedContext` parameter. The context
   * is automatically cleared after each invocation for safety.
   *
   * @example
   * ```ts
   * import { AppSyncGraphQLResolver, Router } from '@aws-lambda-powertools/event-handler/appsync-graphql';
   *
   * const postRouter = new Router();
   * postRouter.onQuery('getPosts', async ({ sharedContext }) => {
   *   const requestId = sharedContext?.get('requestId');
   *   return [{ id: 1, title: 'Post 1', requestId }];
   * });
   *
   * const userRouter = new Router();
   * userRouter.onQuery('getUsers', async ({ sharedContext }) => {
   *   const requestId = sharedContext?.get('requestId');
   *   return [{ id: 1, name: 'John Doe', requestId }];
   * });
   *
   * const app = new AppSyncGraphQLResolver();
   *
   * app.includeRouter([userRouter, postRouter]);
   * app.appendContext({ requestId: '12345' });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * @param data - A record of key-value pairs to add to the shared context
   */
  public appendContext(data: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(data)) {
      this.sharedContext.set(key, value);
    }
  }

  /**
   * Executes the provided asynchronous function with error handling.
   * If the function throws an error, it delegates error processing to `#handleError`
   * and returns the formatted error response.
   *
   * @param fn - A function returning a Promise to be executed with error handling.
   * @param event - The AppSync resolver event (single or first of batch).
   * @param options - Optional resolve options for customizing resolver behavior.
   */
  async #withErrorHandling(
    fn: () => unknown,
    event: AppSyncResolverEvent<Record<string, unknown>>,
    options?: ResolveOptions
  ) {
    try {
      return await fn();
    } catch (error) {
      return this.#handleError(
        error,
        `An error occurred in handler ${event.info.fieldName}`,
        options
      );
    }
  }

  /**
   * Handles errors encountered during resolver execution.
   *
   * Logs the provided error message and error object. If the error is an instance of
   * `InvalidBatchResponseException` or `ResolverNotFoundException`, it is re-thrown.
   * Checks for registered exception handlers and calls them if available.
   * Otherwise, the error is formatted into a response using `#formatErrorResponse`.
   *
   * @param error - The error object to handle.
   * @param errorMessage - A descriptive message to log alongside the error.
   * @param options - Optional resolve options for customizing resolver behavior.
   * @throws InvalidBatchResponseException | ResolverNotFoundException
   */
  async #handleError(
    error: unknown,
    errorMessage: string,
    options?: ResolveOptions
  ): Promise<unknown> {
    this.logger.error(errorMessage, error);
    if (error instanceof InvalidBatchResponseException) throw error;
    if (error instanceof ResolverNotFoundException) throw error;
    if (error instanceof Error) {
      const exceptionHandler = this.exceptionHandlerRegistry.resolve(error);
      if (exceptionHandler) {
        try {
          this.logger.debug(
            `Calling exception handler for error: ${error.name}`
          );
          return await exceptionHandler.apply(options?.scope ?? this, [error]);
        } catch (handlerError) {
          this.logger.error(
            `Exception handler for ${error.name} threw an error`,
            handlerError
          );
        }
      }
    }

    return this.#formatErrorResponse(error);
  }

  /**
   * Executes batch resolvers for multiple AppSync GraphQL events.
   *
   * This method processes an array of AppSync resolver events as a batch operation.
   * It looks up the appropriate batch resolver from the registry using the field name
   * and parent type name from the first event, then delegates to the batch resolver
   * if found.
   *
   * @param events - Array of AppSync resolver events to process as a batch
   * @param context - AWS Lambda context object
   * @param options - Optional resolve options for customizing resolver behavior
   * @throws {ResolverNotFoundException} When no batch resolver is registered for the given type and field combination
   */
  async #executeBatchResolvers(
    events: AppSyncResolverEvent<Record<string, unknown>>[],
    context: Context,
    options?: ResolveOptions
  ): Promise<unknown[]> {
    const { fieldName, parentTypeName: typeName } = events[0].info;
    const batchHandlerOptions = this.batchResolverRegistry.resolve(
      typeName,
      fieldName
    );

    if (batchHandlerOptions) {
      return await this.#callBatchResolver(
        events,
        context,
        batchHandlerOptions,
        options
      );
    }

    throw new ResolverNotFoundException(
      `No batch resolver found for ${typeName}-${fieldName}`
    );
  }

  /**
   * Handles batch invocation of AppSync GraphQL resolvers with support for aggregation and error handling.
   *
   * @param events - An array of AppSyncResolverEvent objects representing the batch of incoming events.
   * @param context - The Lambda context object.
   * @param options - Route handler options, including the handler function, aggregation, and error handling flags.
   * @param resolveOptions - Optional resolve options, such as custom scope for handler invocation.
   *
   * @throws {InvalidBatchResponseException} If the aggregate handler does not return an array.
   *
   * @remarks
   * - If `aggregate` is true, invokes the handler once with the entire batch and expects an array response.
   * - If `throwOnError` is true, errors are propagated and will cause the function to throw.
   * - If `throwOnError` is false, errors are logged and `null` is appended for failed events, allowing graceful degradation.
   */
  async #callBatchResolver(
    events: AppSyncResolverEvent<Record<string, unknown>>[],
    context: Context,
    options: RouteHandlerOptions<Record<string, unknown>, boolean, boolean>,
    resolveOptions?: ResolveOptions
  ): Promise<unknown[]> {
    const { aggregate, throwOnError } = options;
    this.logger.debug(
      `Aggregate flag aggregate=${aggregate} & graceful error handling flag throwOnError=${throwOnError}`
    );

    if (aggregate) {
      const response = await (
        options.handler as BatchResolverAggregateHandlerFn
      ).apply(resolveOptions?.scope ?? this, [
        events,
        {
          event: events,
          context,
          ...(this.sharedContext.size > 0 && {
            sharedContext: this.sharedContext,
          }),
        },
      ]);

      if (!Array.isArray(response)) {
        throw new InvalidBatchResponseException(
          'The response must be an array when using batch resolvers'
        );
      }

      return response;
    }

    const handler = options.handler as BatchResolverHandlerFn;
    const results: unknown[] = [];

    if (throwOnError) {
      for (const event of events) {
        const result = await handler.apply(resolveOptions?.scope ?? this, [
          event.arguments,
          {
            event,
            context,
            ...(this.sharedContext.size > 0 && {
              sharedContext: this.sharedContext,
            }),
          },
        ]);
        results.push(result);
      }
      return results;
    }

    for (let i = 0; i < events.length; i++) {
      try {
        const result = await handler.apply(resolveOptions?.scope ?? this, [
          events[i].arguments,
          {
            event: events[i],
            context,
            ...(this.sharedContext.size > 0 && {
              sharedContext: this.sharedContext,
            }),
          },
        ]);
        results.push(result);
      } catch (error) {
        this.logger.error(error);
        this.logger.debug(
          `Failed to process event #${i + 1} from field '${events[i].info.fieldName}'`
        );
        // By default, we gracefully append `null` for any records that failed processing
        results.push(null);
      }
    }

    return results;
  }

  /**
   * Executes the appropriate resolver for a given AppSync GraphQL event.
   *
   * This method attempts to resolve the handler for the specified field and type name
   * from the resolver registry. If a matching handler is found, it invokes the handler
   * with the event arguments. If no handler is found, it throws a `ResolverNotFoundException`.
   *
   * @param event - The AppSync resolver event containing the necessary information.
   * @param context - The Lambda execution context.
   * @param options - Optional parameters for the resolver, such as the scope of the handler.
   * @throws {ResolverNotFoundException} If no resolver is registered for the given field and type.
   */
  #executeSingleResolver(
    event: AppSyncResolverEvent<Record<string, unknown>>,
    context: Context,
    options?: ResolveOptions
  ): unknown {
    const { fieldName, parentTypeName: typeName } = event.info;

    const resolverHandlerOptions = this.resolverRegistry.resolve(
      typeName,
      fieldName
    );
    if (resolverHandlerOptions) {
      return (resolverHandlerOptions.handler as ResolverHandler).apply(
        options?.scope ?? this,
        [
          event.arguments,
          {
            event,
            context,
            ...(this.sharedContext.size > 0 && {
              sharedContext: this.sharedContext,
            }),
          },
        ]
      );
    }

    throw new ResolverNotFoundException(
      `No resolver found for ${typeName}-${fieldName}`
    );
  }

  /**
   * Format the error response to be returned to the client.
   *
   * @param error - The error object
   */
  #formatErrorResponse(error: unknown) {
    if (error instanceof Error) {
      return {
        error: `${error.name} - ${error.message}`,
      };
    }
    return {
      error: 'An unknown error occurred',
    };
  }
}

export { AppSyncGraphQLResolver };
