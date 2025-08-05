import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type {
  RouteHandlerOptions,
  RouteHandlerRegistryOptions,
} from '../types/appsync-graphql.js';
import type { AppSyncGraphQLResolver } from './AppSyncGraphQLResolver.js';

/**
 * Registry for storing route handlers for GraphQL resolvers in AWS AppSync GraphQL API's.
 *
 * This class should not be used directly unless you are implementing a custom router.
 * Instead, use the {@link AppSyncGraphQLResolver | `AppSyncGraphQLResolver`} class, which is the recommended way to register routes.
 */
class RouteHandlerRegistry {
  /**
   * A map of registered route handlers, keyed by their type & field name.
   */
  protected readonly resolvers: Map<
    string,
    RouteHandlerOptions<Record<string, unknown>, boolean, boolean>
  > = new Map();
  /**
   * A logger instance to be used for logging debug and warning messages.
   */
  readonly #logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;

  public constructor(options: RouteHandlerRegistryOptions) {
    this.#logger = options.logger;
  }

  /**
   * Registers a new GraphQL route resolver for a specific type and field.
   *
   * @param options - The options for registering the route handler, including the GraphQL type name, field name, and the handler function.
   * @param options.fieldName - The field name of the GraphQL type to be registered
   * @param options.handler - The handler function to be called when the GraphQL event is received
   * @param options.typeName - The name of the GraphQL type to be registered
   *
   */
  public register(
    options: RouteHandlerOptions<Record<string, unknown>, boolean, boolean>
  ): void {
    const {
      fieldName,
      handler,
      typeName,
      throwOnError = false,
      aggregate = true,
    } = options;
    this.#logger.debug(`Adding resolver for field ${typeName}.${fieldName}`);
    const cacheKey = this.#makeKey(typeName, fieldName);
    if (this.resolvers.has(cacheKey)) {
      this.#logger.warn(
        `A resolver for field '${fieldName}' is already registered for '${typeName}'. The previous resolver will be replaced.`
      );
    }
    this.resolvers.set(cacheKey, {
      fieldName,
      handler,
      typeName,
      throwOnError,
      aggregate,
    });
  }

  /**
   * Resolves the handler for a specific GraphQL API event.
   *
   * @param typeName - The name of the GraphQL type (e.g., "Query", "Mutation", or a custom type).
   * @param fieldName - The name of the field within the specified type.
   */
  public resolve(
    typeName: string,
    fieldName: string
  ):
    | RouteHandlerOptions<Record<string, unknown>, boolean, boolean>
    | undefined {
    this.#logger.debug(
      `Looking for resolver for type=${typeName}, field=${fieldName}`
    );
    return this.resolvers.get(this.#makeKey(typeName, fieldName));
  }

  /**
   * Generates a unique key by combining the provided GraphQL type name and field name.
   *
   * @param typeName - The name of the GraphQL type.
   * @param fieldName - The name of the GraphQL field.
   */
  #makeKey(typeName: string, fieldName: string): string {
    return `${typeName}.${fieldName}`;
  }
}

export { RouteHandlerRegistry };
