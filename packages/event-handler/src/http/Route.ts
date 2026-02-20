import type {
  HandlerResponse,
  HttpMethod,
  Middleware,
  Path,
  ReqSchema,
  ResSchema,
  RouteHandler,
  TypedRouteHandler,
} from '../types/http.js';

class Route<
  TReq extends ReqSchema = ReqSchema,
  TResBody extends HandlerResponse = HandlerResponse,
  TRes extends ResSchema = ResSchema,
> {
  readonly id: string;
  readonly method: string;
  readonly path: Path;
  readonly handler: RouteHandler | TypedRouteHandler<TReq, TResBody, TRes>;
  readonly middleware: Middleware[];

  constructor(
    method: HttpMethod,
    path: Path,
    handler: RouteHandler | TypedRouteHandler<TReq, TResBody, TRes>,
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
