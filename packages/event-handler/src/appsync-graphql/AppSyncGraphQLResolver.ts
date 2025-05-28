import type { Context } from 'aws-lambda';
import type { AppSyncGraphQLEvent } from '../types/appsync-graphql.js';
import { Router } from './Router.js';
import { ResolverNotFoundException } from './errors.js';
import { isAppSyncGraphQLEvent } from './utils.js';

/**
 * Resolver for AWS AppSync GraphQL APIs.
 *
 * This resolver is designed to handle the `onQuery` and `onMutation` events
 * from AWS AppSync GraphQL APIs. It allows you to register handlers for these events
 * and route them to the appropriate functions based on the event's field & type.
 *
 * @example
 * ```ts
 * import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
 *
 * const app = new AppSyncGraphQLResolver();
 *
 * app.onQuery('getPost', async ({ id }) => {
 *   // your business logic here
 *   return {
 *     id,
 *     title: 'Post Title',
 *     content: 'Post Content',
 *   };
 * });
 *
 * export const handler = async (event, context) =>
 *   app.resolve(event, context);
 * ```
 */
export class AppSyncGraphQLResolver extends Router {
  public async resolve(event: unknown, context: Context): Promise<unknown> {
    if (Array.isArray(event)) {
      this.logger.warn('Batch resolvers are not implemented yet');
      return;
    }
    if (!isAppSyncGraphQLEvent(event)) {
      this.logger.warn(
        'Received an event that is not compatible with this resolver'
      );
      return;
    }
    try {
      return await this.#executeSingleResolver(event);
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
   * Executes the appropriate resolver (query or mutation) for a given AppSync GraphQL event.
   *
   * This method attempts to resolve the handler for the specified field and type name
   * from the query and mutation registries. If a matching handler is found, it invokes
   * the handler with the event arguments. If no handler is found, it throws a
   * `ResolverNotFoundException`.
   *
   * @param event - The AppSync GraphQL event containing resolver information.
   * @throws {ResolverNotFoundException} If no resolver is registered for the given field and type.
   */
  async #executeSingleResolver(event: AppSyncGraphQLEvent): Promise<unknown> {
    const { fieldName, parentTypeName: typeName } = event.info;
    const queryHandlerOptions = this.onQueryRegistry.resolve(
      typeName,
      fieldName
    );
    const mutationHandlerOptions = this.onMutationRegistry.resolve(
      typeName,
      fieldName
    );

    if (queryHandlerOptions) {
      return await queryHandlerOptions.handler.apply(this, [event.arguments]);
    }
    if (mutationHandlerOptions) {
      return await mutationHandlerOptions.handler.apply(this, [
        event.arguments,
      ]);
    }

    throw new ResolverNotFoundException(
      `No resolver found for the event ${fieldName}-${typeName}.`
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
