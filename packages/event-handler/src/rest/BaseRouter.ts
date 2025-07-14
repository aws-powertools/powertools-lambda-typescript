import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import { isRecord } from '@aws-lambda-powertools/commons/typeutils';
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
import { HttpVerbs } from './constatnts.js';

abstract class BaseRouter {
  protected context: Record<string, unknown>;
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
    this.isDev = isDevMode();
  }

  public abstract resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<unknown>;

  public abstract route(handler: RouteHandler, options: RouteOptions): void;

  #handleHttpMethod(
    method: HttpMethod,
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.route(handler, { ...(options || {}), method, path });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      const routeOptions = isRecord(handler) ? handler : options;
      this.route(descriptor.value, { ...(routeOptions || {}), method, path });
      return descriptor;
    };
  }

  public get(path: string, handler: RouteHandler, options?: RouteOptions): void;
  public get(path: string, options?: RouteOptions): MethodDecorator;
  public get(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.GET, path, handler, options);
  }

  public post(path: Path, handler: RouteHandler, options?: RouteOptions): void;
  public post(path: Path, options?: RouteOptions): MethodDecorator;
  public post(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.POST, path, handler, options);
  }

  public put(path: Path, handler: RouteHandler, options?: RouteOptions): void;
  public put(path: Path, options?: RouteOptions): MethodDecorator;
  public put(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.PUT, path, handler, options);
  }

  public patch(path: Path, handler: RouteHandler, options?: RouteOptions): void;
  public patch(path: Path, options?: RouteOptions): MethodDecorator;
  public patch(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.PATCH, path, handler, options);
  }

  public delete(
    path: Path,
    handler: RouteHandler,
    options?: RouteOptions
  ): void;
  public delete(path: Path, options?: RouteOptions): MethodDecorator;
  public delete(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.DELETE, path, handler, options);
  }

  public head(path: Path, handler: RouteHandler, options?: RouteOptions): void;
  public head(path: Path, options?: RouteOptions): MethodDecorator;
  public head(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.HEAD, path, handler, options);
  }

  public options(
    path: Path,
    handler: RouteHandler,
    options?: RouteOptions
  ): void;
  public options(path: Path, options?: RouteOptions): MethodDecorator;
  public options(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.OPTIONS, path, handler, options);
  }

  public connect(
    path: Path,
    handler: RouteHandler,
    options?: RouteOptions
  ): void;
  public connect(path: Path, options?: RouteOptions): MethodDecorator;
  public connect(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.CONNECT, path, handler, options);
  }

  public trace(path: Path, handler: RouteHandler, options?: RouteOptions): void;
  public trace(path: Path, options?: RouteOptions): MethodDecorator;
  public trace(
    path: Path,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(HttpVerbs.TRACE, path, handler, options);
  }
}

export { BaseRouter };
