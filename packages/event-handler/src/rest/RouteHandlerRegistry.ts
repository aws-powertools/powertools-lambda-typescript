import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type {
  DynamicRoute,
  HttpMethod,
  Path,
  RestRouteHandlerOptions,
  RouteRegistryOptions,
  ValidationResult,
} from '../types/rest.js';
import { ParameterValidationError } from './errors.js';
import type { Route } from './Route.js';
import { compilePath, validatePathPattern } from './utils.js';

class RouteHandlerRegistry {
  readonly #staticRoutes: Map<string, Route> = new Map();
  readonly #dynamicRoutesSet: Set<string> = new Set();
  readonly #dynamicRoutes: DynamicRoute[] = [];
  #shouldSort = true;

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
   * Processes route parameters by URL-decoding their values.
   * @param params - Raw parameter values extracted from the route path
   * @returns Processed parameters with URL-decoded values
   */
  #processParams(params: Record<string, string>): Record<string, string> {
    const processed: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      processed[key] = decodeURIComponent(value);
    }

    return processed;
  }
  /**
   * Validates route parameters to ensure they are not empty or whitespace-only.
   * @param params - Parameters to validate
   * @returns Validation result with success status and any issues found
   */
  #validateParams(params: Record<string, string>): ValidationResult {
    const issues: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (!value || value.trim() === '') {
        issues.push(`Parameter '${key}' cannot be empty`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
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
    this.#shouldSort = true;
    const { isValid, issues } = validatePathPattern(route.path);
    if (!isValid) {
      for (const issue of issues) {
        this.#logger.warn(issue);
      }
      return;
    }

    const compiled = compilePath(route.path);

    if (compiled.isDynamic) {
      const dynamicRoute = {
        ...route,
        ...compiled,
      };
      if (this.#dynamicRoutesSet.has(route.id)) {
        this.#logger.warn(
          `Handler for method: ${route.method} and path: ${route.path} already exists. The previous handler will be replaced.`
        );
        // as dynamic routes are stored in an array, we can't rely on
        // overwriting a key in a map like with static routes so have
        // to manually manage overwriting them
        const i = this.#dynamicRoutes.findIndex(
          (oldRoute) => oldRoute.id === route.id
        );
        this.#dynamicRoutes[i] = dynamicRoute;
      } else {
        this.#dynamicRoutes.push(dynamicRoute);
        this.#dynamicRoutesSet.add(route.id);
      }
    } else {
      if (this.#staticRoutes.has(route.id)) {
        this.#logger.warn(
          `Handler for method: ${route.method} and path: ${route.path} already exists. The previous handler will be replaced.`
        );
      }
      this.#staticRoutes.set(route.id, route);
    }
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
  public resolve(
    method: HttpMethod,
    path: Path
  ): RestRouteHandlerOptions | null {
    if (this.#shouldSort) {
      this.#dynamicRoutes.sort(this.#compareRouteSpecificity);
      this.#shouldSort = false;
    }
    const routeId = `${method}:${path}`;

    const staticRoute = this.#staticRoutes.get(routeId);
    if (staticRoute != null) {
      return {
        handler: staticRoute.handler,
        rawParams: {},
        params: {},
        middleware: staticRoute.middleware,
      };
    }

    for (const route of this.#dynamicRoutes) {
      if (route.method !== method) continue;

      const match = route.regex.exec(path);
      if (match?.groups) {
        const params = match.groups;

        const processedParams = this.#processParams(params);

        const validation = this.#validateParams(processedParams);

        if (!validation.isValid) {
          throw new ParameterValidationError(validation.issues);
        }

        return {
          handler: route.handler,
          params: processedParams,
          rawParams: params,
          middleware: route.middleware,
        };
      }
    }

    return null;
  }
}

export { RouteHandlerRegistry };
