import type {
  HandlerResponse,
  HttpMethod,
  Middleware,
  Path,
  RouteHandler,
  TypedRouteHandler,
} from '../types/http.js';

class Route<TReqBody = never, TResBody extends HandlerResponse = HandlerResponse> {
  readonly id: string;
  readonly method: string;
  readonly path: Path;
  readonly handler: RouteHandler | TypedRouteHandler<TReqBody, TResBody>;
  readonly middleware: Middleware[];

  constructor(
    method: HttpMethod,
    path: Path,
    handler: RouteHandler | TypedRouteHandler<TReqBody, TResBody>,
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
