import type {
  HandlerResponse,
  HttpMethod,
  Middleware,
  Path,
  ReqSchema,
  RouteHandler,
  TypedRouteHandler,
} from '../types/http.js';

class Route<
  TReq extends ReqSchema = ReqSchema,
  TResBody extends HandlerResponse = HandlerResponse,
> {
  readonly id: string;
  readonly method: string;
  readonly path: Path;
  readonly handler: RouteHandler | TypedRouteHandler<TReq, TResBody>;
  readonly middleware: Middleware[];

  constructor(
    method: HttpMethod,
    path: Path,
    handler: RouteHandler | TypedRouteHandler<TReq, TResBody>,
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
