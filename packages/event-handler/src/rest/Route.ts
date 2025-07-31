import type { Path, RouteHandler } from '../types/rest.js';

class Route {
  readonly id: string;
  readonly method: string;
  readonly path: Path;
  readonly handler: RouteHandler;

  constructor(method: string, path: Path, handler: RouteHandler) {
    this.id = `${method}:${path}`;
    this.method = method.toUpperCase();
    this.path = path;
    this.handler = handler;
  }
}

export { Route };
