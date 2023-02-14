/* eslint-disable @typescript-eslint/no-explicit-any */

import zlib from 'node:zlib';
import {
  Response,
  Route,
  CORSConfig,
  JSONData,
  Headers,
  Cookie,
  Context,
  HTTPMethod,
} from './types';
import { BaseProxyEvent } from './types/BaseProxyEvent';
import { Context as LambdaContext } from 'aws-lambda';

enum ProxyEventType {
  APIGatewayProxyEvent = 'APIGatewayProxyEvent',
  APIGatewayProxyEventV2 = 'APIGatewayProxyEventV2',
  ALBEvent = 'ALBEvent',
  LambdaFunctionUrlEvent = 'LambdaFunctionUrlEvent',
}

class ResponseBuilder {
  public constructor(public response: Response, public route?: Route) {
    this.response = response;
    this.route = route;
  }

  public build(event: BaseProxyEvent, cors: CORSConfig): JSONData {
    this._route(event, cors);

    if (this.response.body && typeof this.response.body === 'string') {
      this.response.base64Encoded = true;
      this.response.body = Buffer.from(this.response.body, 'utf8').toString(
        'base64'
      );
    }

    return {
      statusCode: this.response.statusCode,
      body: this.response.body,
      isBase64Encoded: this.response.base64Encoded,
      ...event
        .headerSerializer()
        .serialize(
          this.response.headers as Headers,
          this.response.cookies as Cookie[]
        ),
    };
  }

  private _route(event: BaseProxyEvent, cors: CORSConfig): void {
    if (!this.route) {
      return;
    }
    if (this.route.cors) {
      this.addCORS(cors);
    }
    if (this.route.cacheControl) {
      this.addCacheControl(this.route.cacheControl);
    }
    if (
      this.route.compress &&
      event.headerValue('accept-encoding', 'gzip') === 'gzip'
    ) {
      this.compress();
    }
  }

  private addCORS(cors: CORSConfig): void {
    for (const [ key, value ] of cors.headers()) {
      this.response.headers?.set(key, value);
    }
  }

  private addCacheControl(cacheControl: string): void {
    this.response.headers?.set(
      'Cache-Control',
      this.response.statusCode == 200 ? cacheControl : 'no-cache'
    );
  }

  private compress(): void {
    if (this.response.body) {
      this.response.headers?.set('Content-Encoding', 'gzip');
      this.response.body = zlib.gzipSync(Buffer.from(this.response.body));
    }
  }
}

abstract class BaseRouter {
  public context?: Context;
  public currentEvent?: BaseProxyEvent;
  public lambdaContext?: LambdaContext;

  public appendContext(additionalContext: Context): void {
    this.context = new Map([
      ...(this.context?.entries() || []),
      ...(additionalContext?.entries() || []),
    ]);
  }

  public clearContext(): void {
    this.context?.clear();
  }

  public delete(
    rule: string,
    cors?: boolean,
    compress?: boolean,
    cacheControl?: string
  ) {
    return (
      _target: any,
      _propertyKey: string,
      _descriptor: PropertyDescriptor
    ) => {
      this.registerRoute(
        _target[_propertyKey],
        rule,
        'DELETE',
        cors,
        compress,
        cacheControl
      );
    };
  }

  public get(
    rule: string,
    cors?: boolean,
    compress?: boolean,
    cacheControl?: string
  ) {
    return (
      _target: any,
      _propertyKey: string,
      _descriptor: PropertyDescriptor
    ) => {
      this.registerRoute(
        _target[_propertyKey],
        rule,
        'GET',
        cors,
        compress,
        cacheControl
      );
    };
  }

  public patch(
    rule: string,
    cors?: boolean,
    compress?: boolean,
    cacheControl?: string
  ) {
    return (
      _target: any,
      _propertyKey: string,
      _descriptor: PropertyDescriptor
    ) => {
      this.registerRoute(
        _target[_propertyKey],
        rule,
        'PATCH',
        cors,
        compress,
        cacheControl
      );
    };
  }

  public post(
    rule: string,
    cors?: boolean,
    compress?: boolean,
    cacheControl?: string
  ) {
    return (
      _target: any,
      _propertyKey: string,
      _descriptor: PropertyDescriptor
    ) => {
      this.registerRoute(
        _target[_propertyKey],
        rule,
        'POST',
        cors,
        compress,
        cacheControl
      );
    };
  }

  public put(
    rule: string,
    cors?: boolean,
    compress?: boolean,
    cacheControl?: string
  ) {
    return (
      _target: any,
      _propertyKey: string,
      _descriptor: PropertyDescriptor
    ) => {
      this.registerRoute(
        _target[_propertyKey],
        rule,
        'PUT',
        cors,
        compress,
        cacheControl
      );
    };
  }

  public abstract registerRoute(
    func: CallableFunction,
    rule: string,
    method: HTTPMethod,
    cors?: boolean,
    compress?: boolean,
    cacheControl?: string
  ): void;

  public route(
    rule: string,
    method: HTTPMethod,
    cors?: boolean,
    compress?: boolean,
    cacheControl?: string
  ) {
    return (
      _target: any,
      _propertyKey: string,
      _descriptor: PropertyDescriptor
    ) => {
      this.registerRoute(
        _target[_propertyKey],
        rule,
        method,
        cors,
        compress,
        cacheControl
      );
    };
  }
}

class ApiGatewayResolver extends BaseRouter {
  public context: Context;
  public corsEnabled: boolean;
  public corsMethods: HTTPMethod;
  public routeKeys: Set<string>;
  public routes: Route[];

  public constructor(
    public proxyType: ProxyEventType = ProxyEventType.APIGatewayProxyEvent,
    public cors?: CORSConfig,
    public debug?: boolean
  ) {
    super();
    this.proxyType = proxyType;
    this.cors = cors;
    this.debug = debug;
    this.context = new Map<string, string>();

    this.routes = [];
    this.routeKeys = new Set();
    this.corsEnabled = cors !== undefined;
    this.corsMethods = ['OPTIONS'];
    this.context = new Map();
  }

  public _resolve(): Route {
    const method = this.currentEvent?.httpMethod.toUpperCase();
    const path = this.currentEvent?.path;
    console.log(`resolving method: ${method} path: ${path}`);
    for (const route of this.routes) {
      console.log(`found method: ${route.method} path: ${route.rule}`);
      if (!route.method.includes(method!)) {
        continue;
      }
      console.log(`testing for ${path}`);
      if (route.rule.test(path!)) {
        return route;
      }
    }

    throw new Error('Route not found');
  }

  public registerRoute(
    func: CallableFunction,
    rule: string,
    method: HTTPMethod,
    cors?: boolean | undefined,
    compress?: boolean | undefined,
    cacheControl?: string | undefined
  ): void {
    const corsEnabled = cors ? cors : this.corsEnabled;
    for (const item of [method].flat()) {
      this.routes.push(
        new Route(
          method,
          new RegExp(rule),
          func,
          corsEnabled,
          compress,
          cacheControl
        )
      );
      this.routeKeys.add(`${method}_${rule}`);
      if (this.corsEnabled) {
        (this.corsMethods as string[]).push(item.toUpperCase());
      }
    }
  }

  // public resolve(event: BaseProxyEvent, context: Context) {
  //   this.currentEvent = event;
  //   this.lambdaContext = context ;
  //   const response = this._resolve().build(this.currentEvent, this.cors);
  //   this.clearContext();

  //   return response;
  // }

  // private _resolve(): ResponseBuilder {
  //   const method = this.currentEvent?.httpMethod.toUpperCase();
  //   const path = this.currentEvent?.path;
  //   for (const route of this.routes) {
  //   }
  // }

}

class Router extends BaseRouter {
  public constructor(public routes: Route[]) {
    super();
    this.routes = [];
  }

  public registerRoute(
    func: CallableFunction,
    rule: string,
    method: HTTPMethod,
    cors?: boolean | undefined,
    compress?: boolean | undefined,
    cacheControl?: string | undefined
  ): void {
    this.routes.push(
      new Route(method, new RegExp(rule), func, cors, compress, cacheControl)
    );
  }
}

export {
  ProxyEventType,
  ResponseBuilder,
  BaseRouter,
  ApiGatewayResolver,
  Router,
};
