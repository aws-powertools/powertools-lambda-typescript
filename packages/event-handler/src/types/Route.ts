import { PathPattern, HTTPMethod } from './common';

class Route {
  public constructor(
    public method: HTTPMethod,
    public rule: PathPattern,
    public func: CallableFunction,
    public cors: boolean = false,
    public compress: boolean = false,
    public cacheControl?: string
  ) {
    if (typeof method === 'string') {
      this.method = [method.toUpperCase()];
    } else {
      this.method = method.map((m) => m.toUpperCase());
    }
    this.rule = rule;
    this.func = func;
    this.cors = cors;
    this.compress = compress;
    this.cacheControl = cacheControl;
  }
}

export { Route };
