import { LRUCache } from '@aws-lambda-powertools/commons/utils/lru-cache';
import type {
  GenericLogger,
  RouteHandlerOptions,
  RouteHandlerRegistryOptions,
} from '../types/appsync-events.js';
import type { Router } from './Router.js';

/**
 * Registry for storing route handlers for the `onPublish` and `onSubscribe` events in AWS AppSync Events APIs.
 *
 * This class should not be used directly unless you are implementing a custom router.
 * Instead, use the {@link Router} class, which is the recommended way to register routes.
 */
class RouteHandlerRegistry {
  /**
   * A map of registered route handlers, keyed by their regular expression patterns.
   */
  protected readonly resolvers: Map<string, RouteHandlerOptions<boolean>> =
    new Map();
  /**
   * A logger instance to be used for logging debug and warning messages.
   */
  readonly #logger: GenericLogger;
  /**
   * The event type stored in the registry.
   */
  readonly #eventType: 'onPublish' | 'onSubscribe';
  /**
   * A cache for storing the resolved route handlers.
   * This is used to improve performance by avoiding repeated regex matching.
   */
  readonly #resolverCache: LRUCache<string, RouteHandlerOptions<boolean>> =
    new LRUCache({
      maxSize: 100,
    });
  /**
   * A set of warning messages to avoid duplicate warnings.
   */
  readonly #warningSet: Set<string> = new Set();

  public constructor(options: RouteHandlerRegistryOptions) {
    this.#logger = options.logger;
    this.#eventType = options.eventType ?? 'onPublish';
  }

  /**
   * Register a route handler function for a specific path.
   *
   * A path should always have a namespace starting with `/`, for example `/default/*`.
   * A path can have multiple namespaces, all separated by `/`, for example `/default/foo/bar`.
   * Wildcards are allowed only at the end of the path, for example `/default/*` or `/default/foo/*`.
   *
   * If the path is already registered, the previous handler will be replaced and a warning will be logged.
   *
   * @param options - The options for the route handler
   * @param options.path - The path of the event to be registered, default is `/default/*`
   * @param options.handler - The handler function to be called when the event is received
   * @param options.aggregate - Whether the route handler will send all the events to the route handler at once or one by one, default is `false`
   */
  public register(options: RouteHandlerOptions<boolean>): void {
    const { path, handler, aggregate = false } = options;
    this.#logger.debug(
      `Registering ${this.#eventType} route handler for path '${path}' with aggregate '${aggregate}'`
    );
    if (!RouteHandlerRegistry.isValidPath(path)) {
      this.#logger.warn(
        `The path '${path}' registered for ${this.#eventType} is not valid and will be skipped. A path should always have a namespace starting with '/'. A path can have multiple namespaces, all separated by '/'. Wildcards are allowed only at the end of the path.`
      );
      return;
    }
    const regex = RouteHandlerRegistry.pathToRegexString(path);
    if (this.resolvers.has(regex)) {
      this.#logger.warn(
        `A route handler for path '${path}' is already registered for ${this.#eventType}. The previous handler will be replaced.`
      );
    }
    this.resolvers.set(regex, {
      path,
      handler,
      aggregate,
    });
  }

  /**
   * Resolve the handler for a specific path.
   *
   * Find the most specific handler for the given path, which is the longest one minus the wildcard.
   * If no handler is found, it returns `undefined`.
   *
   * Examples of specificity:
   * - `'/default/v1/users'`    -> score: 14 (len=14, wildcards=0)
   * - `'/default/v1/users/*'`  -> score: 14 (len=15, wildcards=1)
   * - `'/default/v1/*'`        -> score: 8  (len=9, wildcards=1)
   * - `'/*'`                   -> score: 0  (len=1, wildcards=1)
   *
   * @param path - The path of the event to be resolved
   */
  public resolve(path: string): RouteHandlerOptions<boolean> | undefined {
    if (this.#resolverCache.has(path)) {
      return this.#resolverCache.get(path);
    }
    this.#logger.debug(`Resolving handler for path '${path}'`);
    let mostSpecificHandler = undefined;
    let mostSpecificRouteLength = 0;
    for (const [key, value] of this.resolvers.entries()) {
      if (new RegExp(key).test(path)) {
        const specificityLength =
          value.path.length - (value.path.endsWith('*') ? 1 : 0);
        if (specificityLength > mostSpecificRouteLength) {
          mostSpecificRouteLength = specificityLength;
          mostSpecificHandler = value;
        }
      }
    }
    if (mostSpecificHandler === undefined) {
      if (!this.#warningSet.has(path)) {
        this.#logger.warn(
          `No route handler found for path '${path}' registered for ${this.#eventType}.`
        );
        this.#warningSet.add(path);
      }
      return undefined;
    }
    this.#resolverCache.add(path, mostSpecificHandler);
    return mostSpecificHandler;
  }

  /**
   * Check if the path is valid.
   *
   * A path should always have a namespace starting with `/`, for example `/default/*`.
   * A path can have multiple namespaces, all separated by `/`, for example `/default/foo/bar`.
   * Wildcards are allowed only at the end of the path, for example `/default/*` or `/default/foo/*`.
   *
   * @param path - The path of the event to be registered
   */
  static isValidPath(path: string): boolean {
    if (path === '/*') return true;
    const pathRegex = /^\/([^\/\*]+)(\/[^\/\*]+)*(\/\*)?$/;
    return pathRegex.test(path);
  }

  /**
   * Convert a path to a regular expression string.
   *
   * In doing so, it escapes all special characters and replaces the wildcard `*` with `.*`.
   *
   * @param path - The path to be converted to a regex string
   */
  static pathToRegexString(path: string): string {
    const escapedPath = path.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    return `^${escapedPath.replace(/\\\*/g, '.*')}$`;
  }
}

export { RouteHandlerRegistry };
