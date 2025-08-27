import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import type {
  BatchResolverAggregateHandlerFn,
  BatchResolverHandlerFn,
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
  public async resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<unknown> {
    if (Array.isArray(event)) {
      if (event.some((e) => !isAppSyncGraphQLEvent(e))) {
        this.logger.warn(
          'Received a batch event that is not compatible with this resolver'
        );
        return;
      }
      return this.#withErrorHandling(
        () => this.#executeBatchResolvers(event, context, options),
        event[0],
        options
      );
    }
    if (!isAppSyncGraphQLEvent(event)) {
      this.logger.warn(
        'Received an event that is not compatible with this resolver'
      );
      return;
    }

    return this.#withErrorHandling(
      () => this.#executeSingleResolver(event, context, options),
      event,
      options
    );
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
    fn: () => Promise<unknown>,
    event: AppSyncResolverEvent<Record<string, unknown>>,
    options?: ResolveOptions
  ): Promise<unknown> {
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
        { event: events, context },
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
          { event, context },
        ]);
        results.push(result);
      }
      return results;
    }

    for (let i = 0; i < events.length; i++) {
      try {
        const result = await handler.apply(resolveOptions?.scope ?? this, [
          events[i].arguments,
          { event: events[i], context },
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
  async #executeSingleResolver(
    event: AppSyncResolverEvent<Record<string, unknown>>,
    context: Context,
    options?: ResolveOptions
  ): Promise<unknown> {
    const { fieldName, parentTypeName: typeName } = event.info;

    const resolverHandlerOptions = this.resolverRegistry.resolve(
      typeName,
      fieldName
    );
    if (resolverHandlerOptions) {
      return (resolverHandlerOptions.handler as ResolverHandler).apply(
        options?.scope ?? this,
        [event.arguments, { event, context }]
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
