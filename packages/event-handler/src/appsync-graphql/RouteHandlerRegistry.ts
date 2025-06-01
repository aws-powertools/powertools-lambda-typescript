import { LRUCache } from '@aws-lambda-powertools/commons/utils/lru-cache';
import type {
  GenericLogger,
  RouteHandlerOptions,
  RouteHandlerRegistryOptions,
} from '../types/appsync-graphql.js';

/**
 * Registry for storing route handlers for the `query` and `mutation` events in AWS AppSync GraphQL API's.
 *
 * This class should not be used directly unless you are implementing a custom router.
 * Instead, use the {@link Router} class, which is the recommended way to register routes.
 */
class RouteHandlerRegistry {
  /**
   * A map of registered route handlers, keyed by their type & field name.
   */
  protected readonly resolvers: Map<string, RouteHandlerOptions> = new Map();
  /**
   * A logger instance to be used for logging debug and warning messages.
   */
  readonly #logger: GenericLogger;
  /**
   * The event type stored in the registry.
   */
  readonly #eventType: 'onQuery' | 'onMutation';
  /**
   * A cache for storing the resolved route handlers.
   */
  readonly #resolverCache: LRUCache<string, RouteHandlerOptions> = new LRUCache(
    {
      maxSize: 100,
    }
  );
  /**
   * A set of warning messages to avoid duplicate warnings.
   */
  readonly #warningSet: Set<string> = new Set();

  public constructor(options: RouteHandlerRegistryOptions) {
    this.#logger = options.logger;
    this.#eventType = options.eventType ?? 'onQuery';
  }

  /**
   * Registers a new GraphQL route handler for a specific type and field.
   *
   * @param options - The options for registering the route handler, including the GraphQL type name, field name, and the handler function.
   * @param options.fieldName - The field name of the GraphQL type to be registered
   * @param options.handler - The handler function to be called when the GraphQL event is received
   * @param options.typeName - The name of the GraphQL type to be registered
   *
   */
  public register(options: RouteHandlerOptions): void {
    const { fieldName, handler, typeName } = options;
    this.#logger.debug(
      `Adding resolver ${handler.name} for field ${typeName}.${fieldName}`
    );
    const cacheKey = this.#makeKey(typeName, fieldName);
    if (this.resolvers.has(cacheKey)) {
      this.#logger.warn(
        `A route handler for field '${fieldName}' is already registered for '${typeName}'. The previous handler will be replaced.`
      );
    }
    this.resolvers.set(cacheKey, {
      fieldName,
      handler,
      typeName,
    });
  }

  /**
   * Resolves the handler for a specific GraphQL API event.
   *
   * This method first checks an internal cache for the handler. If not found, it attempts to retrieve
   * the handler from the registered resolvers. If the handler is still not found, a warning is logged
   * (only once per missing handler), and `undefined` is returned.
   *
   * @param typeName - The name of the GraphQL type.
   * @param fieldName - The name of the field within the GraphQL type.
   */
  public resolve(
    typeName: string,
    fieldName: string
  ): RouteHandlerOptions | undefined {
    const cacheKey = this.#makeKey(typeName, fieldName);
    if (this.#resolverCache.has(cacheKey))
      return this.#resolverCache.get(cacheKey);
    this.#logger.debug(
      `Looking for resolver for type=${typeName}, field=${fieldName}`
    );
    const handler = this.resolvers.get(cacheKey);
    if (handler === undefined) {
      if (!this.#warningSet.has(cacheKey)) {
        this.#logger.warn(`No resolver found for ${typeName}-${fieldName}`);
        this.#warningSet.add(cacheKey);
      }
      return undefined;
    }
    this.#resolverCache.add(cacheKey, handler);
    return handler;
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
