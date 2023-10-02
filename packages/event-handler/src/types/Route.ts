import { Middleware } from '../middleware';
import { PathPattern, HTTPMethod, Path, AsyncFunction } from './common';

/**
 * HTTP Router model
 *
 * A `route` defines the HTTP method & URL pattern (an HTTP endpoint) and the associated function that must be called when the event handler resolves the incoming HTTP request.
 * Also, it provides endpoint-level additional configuration to enable CORS, compression & setup middlewares.
 */
class Route {
  public constructor(
    public method: HTTPMethod,
    public rule: Path | PathPattern,
    public func: AsyncFunction,
    public cors = false,
    public compress = false,
    public cacheControl?: string,
    public middlewares: Middleware[] = []
  ) {
    if (typeof method === 'string') {
      this.method = [method.toUpperCase()];
    } else {
      this.method = method.map((m) => m.toUpperCase());
    }
  }
}
export { Route };
