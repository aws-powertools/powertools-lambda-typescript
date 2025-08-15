import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import {
  getStringFromEnv,
  isDevMode,
} from '@aws-lambda-powertools/commons/utils/env';
import type { Context } from 'aws-lambda';
import type { ResolveOptions } from '../types/index.js';
import type {
  ErrorConstructor,
  ErrorHandler,
  ErrorResolveOptions,
  HttpMethod,
  Path,
  RouteHandler,
  RouteOptions,
  RouterOptions,
} from '../types/rest.js';
import { HttpVerbs } from './constants.js';
import { ErrorHandlerRegistry } from './ErrorHandlerRegistry.js';
import {
  MethodNotAllowedError,
  NotFoundError,
  ServiceError,
} from './errors.js';
import { Route } from './Route.js';
import { RouteHandlerRegistry } from './RouteHandlerRegistry.js';

abstract class BaseRouter {
  protected context: Record<string, unknown>;

  protected readonly routeRegistry: RouteHandlerRegistry;
  protected readonly errorHandlerRegistry: ErrorHandlerRegistry;

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

  protected constructor(options?: RouterOptions) {
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
    this.errorHandlerRegistry = new ErrorHandlerRegistry({
      logger: this.logger,
    });
    this.isDev = isDevMode();
  }

  /**
   * Registers a custom error handler for specific error types.
   *
   * @param errorType - The error constructor(s) to handle
   * @param handler - The error handler function that returns an ErrorResponse
   */
  public errorHandler<T extends Error>(
    errorType: ErrorConstructor<T> | ErrorConstructor<T>[],
    handler: ErrorHandler<T>
  ): void;
  public errorHandler<T extends Error>(
    errorType: ErrorConstructor<T> | ErrorConstructor<T>[]
  ): MethodDecorator;
  public errorHandler<T extends Error>(
    errorType: ErrorConstructor<T> | ErrorConstructor<T>[],
    handler?: ErrorHandler<T>
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.errorHandlerRegistry.register(errorType, handler);
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.errorHandlerRegistry.register(errorType, descriptor?.value);
      return descriptor;
    };
  }

  /**
   * Registers a custom handler for 404 Not Found errors.
   *
   * @param handler - The error handler function for NotFoundError
   */
  public notFound(handler: ErrorHandler<NotFoundError>): void;
  public notFound(): MethodDecorator;
  public notFound(
    handler?: ErrorHandler<NotFoundError>
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.errorHandlerRegistry.register(NotFoundError, handler);
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.errorHandlerRegistry.register(NotFoundError, descriptor?.value);
      return descriptor;
    };
  }

  /**
   * Registers a custom handler for 405 Method Not Allowed errors.
   *
   * @param handler - The error handler function for MethodNotAllowedError
   */
  public methodNotAllowed(handler: ErrorHandler<MethodNotAllowedError>): void;
  public methodNotAllowed(): MethodDecorator;
  public methodNotAllowed(
    handler?: ErrorHandler<MethodNotAllowedError>
  ): MethodDecorator | undefined {
    if (handler && typeof handler === 'function') {
      this.errorHandlerRegistry.register(MethodNotAllowedError, handler);
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.errorHandlerRegistry.register(
        MethodNotAllowedError,
        descriptor?.value
      );
      return descriptor;
    };
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

  /**
   * Handles errors by finding a registered error handler or falling
   * back to a default handler.
   *
   * @param error - The error to handle
   * @param options - Optional resolve options for scope binding
   * @returns A Response object with appropriate status code and error details
   */
  protected async handleError(
    error: Error,
    options: ErrorResolveOptions
  ): Promise<Response> {
    const handler = this.errorHandlerRegistry.resolve(error);
    if (handler !== null) {
      try {
        const body = await handler.apply(options.scope ?? this, [
          error,
          {
            request: options.request,
            event: options.event,
            context: options.context,
          },
        ]);
        return new Response(JSON.stringify(body), {
          status: body.statusCode,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (handlerError) {
        return this.#defaultErrorHandler(handlerError as Error);
      }
    }

    if (error instanceof ServiceError) {
      return new Response(JSON.stringify(error.toJSON()), {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return this.#defaultErrorHandler(error);
  }

  /**
   * Default error handler that returns a 500 Internal Server Error response.
   * In development mode, includes stack trace and error details.
   *
   * @param error - The error to handle
   * @returns A Response object with 500 status and error details
   */
  #defaultErrorHandler(error: Error): Response {
    return new Response(
      JSON.stringify({
        statusCode: 500,
        error: 'Internal Server Error',
        message: isDevMode() ? error.message : 'Internal Server Error',
        ...(isDevMode() && {
          stack: error.stack,
          details: { errorName: error.name },
        }),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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
}

export { BaseRouter };
