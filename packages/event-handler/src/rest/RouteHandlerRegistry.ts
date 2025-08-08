import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type {
  DynamicRoute,
  HttpMethod,
  Path,
  RouteHandlerOptions,
  RouteRegistryOptions,
} from '../types/rest.js';
import { ParameterValidationError } from './errors.js';
import type { Route } from './Route.js';
import {
  compilePath,
  processParams,
  validateParams,
  validatePathPattern,
} from './utils.js';

class RouteHandlerRegistry {
  readonly #staticRoutes: Map<string, Route> = new Map();
  readonly #dynamicRoutesIndexMap: Map<string, number> = new Map();
  readonly #dynamicRoutes: DynamicRoute[] = [];
  readonly #routesByMethod: Map<string, Route[]> = new Map();

  readonly #logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;

  constructor(options: RouteRegistryOptions) {
    this.#logger = options.logger;
  }

  /**
   * Compares two dynamic routes to determine their specificity order.
   * Routes with fewer parameters and more path segments are considered more specific.
   * @param a - First dynamic route to compare
   * @param b - Second dynamic route to compare
   * @returns Negative if a is more specific, positive if b is more specific, 0 if equal
   */
  #compareRouteSpecificity(a: DynamicRoute, b: DynamicRoute): number {
    // Routes with fewer parameters are more specific
    const aParams = a.paramNames.length;
    const bParams = b.paramNames.length;

    if (aParams !== bParams) {
      return aParams - bParams;
    }

    // Routes with more path segments are more specific
    const aSegments = a.path.split('/').length;
    const bSegments = b.path.split('/').length;

    return bSegments - aSegments;
  }
  /**
   * Adds a dynamic route to the registry, ensuring that the dynamic
   * routes array says sorted in ascending order of specificity.
   * @param route - The dynamic route to add
   * @returns The index in the specific routes array where the route was stored
   */
  #addDynamicRoute(route: DynamicRoute): number {
    for (let i = 0; i < this.#dynamicRoutes.length; i++) {
      const existingRoute = this.#dynamicRoutes[i];
      if (this.#compareRouteSpecificity(route, existingRoute) < 0) {
        this.#dynamicRoutes.splice(i, 0, route);
        return i;
      }
    }

    this.#dynamicRoutes.push(route);
    return this.#dynamicRoutes.length - 1;
  }

  /**
   * Registers a route in the registry after validating its path pattern.
   *
   * The function decides whether to store the route in the static registry
   * (for exact paths like `/users`) or dynamic registry (for parameterized
   * paths like `/users/:id`) based on the compiled path analysis.
   *
   * @param route - The route to register
   */
  public register(route: Route): void {
    const { isValid, issues } = validatePathPattern(route.path);
    if (!isValid) {
      for (const issue of issues) {
        this.#logger.warn(issue);
      }
      return;
    }

    const compiled = compilePath(route.path);

    if (compiled.isDynamic) {
      if (this.#dynamicRoutesIndexMap.has(route.id)) {
        this.#logger.warn(
          `Handler for method: ${route.method} and path: ${route.path} already exists. The previous handler will be replaced.`
        );
        const index = this.#dynamicRoutesIndexMap.get(route.id)!;
        this.#dynamicRoutes.splice(index, 1);
      }

      const index = this.#addDynamicRoute({
        ...route,
        ...compiled,
      });

      this.#dynamicRoutesIndexMap.set(route.id, index);
    } else {
      if (this.#staticRoutes.has(route.id)) {
        this.#logger.warn(
          `Handler for method: ${route.method} and path: ${route.path} already exists. The previous handler will be replaced.`
        );
      }
      this.#staticRoutes.set(route.id, route);
    }

    const routesByMethod = this.#routesByMethod.get(route.method) ?? [];
    routesByMethod.push(route);
    this.#routesByMethod.set(route.method, routesByMethod);
  }

  /**
   * Resolves a route handler for the given HTTP method and path.
   *
   * Static routes are checked first for exact matches. Dynamic routes are then
   * checked in order of specificity (fewer parameters and more segments first).
   * If no handler is found, it returns `null`.
   *
   * Examples of specificity (given registered routes `/users/:id` and `/users/:id/posts/:postId`):
   * - For path `'/users/123/posts/456'`:
   *   - `/users/:id` matches but has fewer segments (2 vs 4)
   *   - `/users/:id/posts/:postId` matches and is more specific -> **selected**
   * - For path `'/users/123'`:
   *   - `/users/:id` matches exactly -> **selected**
   *   - `/users/:id/posts/:postId` doesn't match (too many segments)
   *
   * @param method - The HTTP method to match
   * @param path - The path to match
   * @returns Route handler options or null if no match found
   */
  public resolve(method: HttpMethod, path: Path): RouteHandlerOptions | null {
    const routeId = `${method}:${path}`;

    const staticRoute = this.#staticRoutes.get(routeId);
    if (staticRoute != null) {
      return {
        handler: staticRoute.handler,
        rawParams: {},
        params: {},
      };
    }

    for (const route of this.#dynamicRoutes) {
      if (route.method !== method) continue;

      const match = route.regex.exec(path);
      if (match?.groups) {
        const params = match.groups;

        const processedParams = processParams(params);

        const validation = validateParams(processedParams);

        if (!validation.isValid) {
          throw new ParameterValidationError(validation.issues);
        }

        return {
          handler: route.handler,
          params: processedParams,
          rawParams: params,
        };
      }
    }

    return null;
  }

  /**
   * Returns the total number of registered routes.
   * @returns Total count of registered routes
   */
  public getRouteCount(): number {
    return [...Array.from(this.#staticRoutes.values()), ...this.#dynamicRoutes]
      .length;
  }

  /**
   * Returns all routes registered for a specific HTTP method.
   * @param method - The HTTP method to filter by
   * @returns Array of routes for the specified method
   */
  public getRoutesByMethod(method: string): Route[] {
    return this.#routesByMethod.get(method.toUpperCase()) || [];
  }

  /**
   * Returns all registered routes (both static and dynamic).
   * @returns Array of all registered routes
   */
  public getAllRoutes(): Route[] {
    return [...Array.from(this.#staticRoutes.values()), ...this.#dynamicRoutes];
  }
}

export { RouteHandlerRegistry };
