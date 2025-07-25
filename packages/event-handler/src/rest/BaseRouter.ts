import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import {
  getStringFromEnv,
  isDevMode,
} from '@aws-lambda-powertools/commons/utils/env';
import type { Context } from 'aws-lambda';
import type { ResolveOptions } from '../types/index.js';
import type {
  HttpMethod,
  Path,
  RouteHandler,
  RouteOptions,
  RouterOptions,
} from '../types/rest.js';
import { HttpVerbs } from './constants.js';
import { Route } from './Route.js';
import { RouteHandlerRegistry } from './RouteHandlerRegistry.js';

abstract class BaseRouter {
  protected context: Record<string, unknown>;

  protected routeRegistry: RouteHandlerRegistry;

  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  protected readonly logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
  /**
   * Whether the router is running in development mode.
   */
  protected readonly isDev: boolean = false;

  public constructor(options?: RouterOptions) {
    this.context = {};
    const alcLogLevel = getStringFromEnv({
      key: 'AWS_LAMBDA_LOG_LEVEL',
      defaultValue: '',
    });
    this.logger = options?.logger ?? {
      debug: alcLogLevel === 'DEBUG' ? console.debug : () => undefined,
      error: console.error,
      warn: console.warn,
    };
    this.routeRegistry = new RouteHandlerRegistry({ logger: this.logger });
    this.isDev = isDevMode();
  }

  public abstract resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<unknown>;

  public route(handler: RouteHandler, options: RouteOptions): void {
    const { method, path } = options;
    const methods = Array.isArray(method) ? method : [method];

    for (const method of methods) {
      this.routeRegistry.register(new Route(method, path, handler));
    }
  }

  #handleHttpMethod(
    method: HttpMethod,
    path: Path,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.route(handler, { method, path });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.route(descriptor.value, { method, path });
      return descriptor;
    };
  }

  public get(path: Path, handler: RouteHandler): void;
  public get(path: Path): MethodDecorator;
  public get(path: Path, handler?: RouteHandler): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.GET, path, handler);
  }

  public post(path: Path, handler: RouteHandler): void;
  public post(path: Path): MethodDecorator;
  public post(path: Path, handler?: RouteHandler): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.POST, path, handler);
  }

  public put(path: Path, handler: RouteHandler): void;
  public put(path: Path): MethodDecorator;
  public put(path: Path, handler?: RouteHandler): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.PUT, path, handler);
  }

  public patch(path: Path, handler: RouteHandler): void;
  public patch(path: Path): MethodDecorator;
  public patch(
    path: Path,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.PATCH, path, handler);
  }

  public delete(path: Path, handler: RouteHandler): void;
  public delete(path: Path): MethodDecorator;
  public delete(
    path: Path,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.DELETE, path, handler);
  }

  public head(path: Path, handler: RouteHandler): void;
  public head(path: Path): MethodDecorator;
  public head(path: Path, handler?: RouteHandler): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.HEAD, path, handler);
  }

  public options(path: Path, handler: RouteHandler): void;
  public options(path: Path): MethodDecorator;
  public options(
    path: Path,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.OPTIONS, path, handler);
  }

  public connect(path: Path, handler: RouteHandler): void;
  public connect(path: Path): MethodDecorator;
  public connect(
    path: Path,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.CONNECT, path, handler);
  }

  public trace(path: Path, handler: RouteHandler): void;
  public trace(path: Path): MethodDecorator;
  public trace(
    path: Path,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.TRACE, path, handler);
  }
}

export { BaseRouter };
