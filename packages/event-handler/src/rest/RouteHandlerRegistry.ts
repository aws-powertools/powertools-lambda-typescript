import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { RouteRegistryOptions } from '../types/rest.js';
import type { Route } from './Route.js';
import { validatePathPattern } from './utils.js';

class RouteHandlerRegistry {
  readonly #routes: Map<string, Route> = new Map();
  readonly #routesByMethod: Map<string, Route[]> = new Map();

  readonly #logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;

  constructor(options: RouteRegistryOptions) {
    this.#logger = options.logger;
  }

  public register(route: Route): void {
    const { isValid, issues } = validatePathPattern(route.path);
    if (!isValid) {
      for (const issue of issues) {
        this.#logger.warn(issue);
      }
      return;
    }

    if (this.#routes.has(route.id)) {
      this.#logger.warn(
        `Handler for method: ${route.method} and path: ${route.path} already exists. The previous handler will be replaced.`
      );
    }

    this.#routes.set(route.id, route);

    const routesByMethod = this.#routesByMethod.get(route.method) ?? [];
    routesByMethod.push(route);
    this.#routesByMethod.set(route.method, routesByMethod);
  }

  public getRouteCount(): number {
    return this.#routes.size;
  }

  public getRoutesByMethod(method: string): Route[] {
    return this.#routesByMethod.get(method.toUpperCase()) || [];
  }

  public getAllRoutes(): Route[] {
    return Array.from(this.#routes.values());
  }
}

export { RouteHandlerRegistry };
