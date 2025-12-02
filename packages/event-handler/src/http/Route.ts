import type {
  HttpMethod,
  Middleware,
  Path,
  RouteHandler,
} from '../types/http.js';

class Route {
  readonly id: string;
  readonly method: string;
  readonly path: Path;
  readonly handler: RouteHandler;
  readonly middleware: Middleware[];

  constructor(
    method: HttpMethod,
    path: Path,
    handler: RouteHandler,
    middleware: Middleware[] = []
  ) {
    this.id = `${method}:${path}`;
    this.method = method;
    this.path = path;
    this.handler = handler;
    this.middleware = middleware;
  }
}

export { Route };
