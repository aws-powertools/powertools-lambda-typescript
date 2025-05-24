import { isRecord } from '@aws-lambda-powertools/commons/typeutils';
import {
  getStringFromEnv,
  isDevMode,
} from '@aws-lambda-powertools/commons/utils/env';
import type { GenericLogger } from '../types/appsync-events.js';
import type {
  RouteHandler,
  RouteOptions,
  RouterOptions,
} from '../types/rest.js';

abstract class BaseRouter {
  protected context: Record<string, unknown>; // TODO: should this be a map instead?
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

  public abstract route(handler: RouteHandler, options: RouteOptions): void;

  public get(path: string, handler: RouteHandler, options?: RouteOptions): void;
  public get(path: string, options?: RouteOptions): MethodDecorator;
  public get(
    path: string,
    handler?: RouteHandler | RouteOptions,
    options?: RouteOptions
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.route(handler, {
        ...(options || {}),
        method: 'GET',
        path,
      });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      const routeOptions = isRecord(handler) ? handler : options;
      this.route(descriptor.value, {
        ...(routeOptions || {}),
        method: 'GET',
        path,
      });
      return descriptor;
    };
  }
}

export { BaseRouter };
