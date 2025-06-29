import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import type { ResolveOptions } from '../types/appsync-graphql.js';
import { Router } from './Router.js';
import { ResolverNotFoundException } from './errors.js';
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
export class AppSyncGraphQLResolver extends Router {
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
   * @param event - The incoming event, which may be an AppSync GraphQL event or an array of events.
   * @param context - The Lambda execution context.
   * @param options - Optional parameters for the resolver, such as the scope of the handler.
   */
  public async resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<unknown> {
    if (Array.isArray(event)) {
      this.logger.warn('Batch resolver is not implemented yet');
      return;
    }
    if (!isAppSyncGraphQLEvent(event)) {
      this.logger.warn(
        'Received an event that is not compatible with this resolver'
      );
      return;
    }
    try {
      return await this.#executeSingleResolver(event, context, options);
    } catch (error) {
      this.logger.error(
        `An error occurred in handler ${event.info.fieldName}`,
        error
      );
      if (error instanceof ResolverNotFoundException) throw error;
      return this.#formatErrorResponse(error);
    }
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
      return resolverHandlerOptions.handler.apply(options?.scope ?? this, [
        event.arguments,
        event,
        context,
      ]);
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
