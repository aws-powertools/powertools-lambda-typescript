import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import {
  getStringFromEnv,
  isDevMode,
} from '@aws-lambda-powertools/commons/utils/env';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
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
import { HttpErrorCodes, HttpVerbs } from './constants.js';
import {
  handlerResultToProxyResult,
  proxyEventToWebRequest,
  responseToProxyResult,
} from './converters.js';
import { ErrorHandlerRegistry } from './ErrorHandlerRegistry.js';
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ServiceError,
} from './errors.js';
import { Route } from './Route.js';
import { RouteHandlerRegistry } from './RouteHandlerRegistry.js';
import { isAPIGatewayProxyEvent, isHttpMethod } from './utils.js';

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

  /**
   * Resolves an API Gateway event by routing it to the appropriate handler
   * and converting the result to an API Gateway proxy result. Handles errors
   * using registered error handlers or falls back to default error handling
   * (500 Internal Server Error).
   *
   * @param event - The Lambda event to resolve
   * @param context - The Lambda context
   * @param options - Optional resolve options for scope binding
   * @returns An API Gateway proxy result or undefined for incompatible events
   */
  public async resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<APIGatewayProxyResult | undefined> {
    if (!isAPIGatewayProxyEvent(event)) {
      this.logger.error(
        'Received an event that is not compatible with this resolver'
      );
      throw new InternalServerError();
    }

    const method = event.requestContext.httpMethod.toUpperCase();
    if (!isHttpMethod(method)) {
      this.logger.error(`HTTP method ${method} is not supported.`);
      // We can't throw a MethodNotAllowedError outside the try block as it
      // will be converted to an internal server error by the API Gateway runtime
      return {
        statusCode: HttpErrorCodes.METHOD_NOT_ALLOWED,
        body: '',
      };
    }

    const request = proxyEventToWebRequest(event);

    try {
      const path = new URL(request.url).pathname as Path;

      const route = this.routeRegistry.resolve(method, path);

      if (route === null) {
        throw new NotFoundError(`Route ${path} for method ${method} not found`);
      }

      const result = await route.handler.apply(options?.scope ?? this, [
        route.params,
        {
          event,
          context,
          request,
        },
      ]);

      return await handlerResultToProxyResult(result);
    } catch (error) {
      this.logger.debug(`There was an error processing the request: ${error}`);
      const result = await this.handleError(error as Error, {
        request,
        event,
        context,
        scope: options?.scope,
      });
      return await responseToProxyResult(result);
    }
  }

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
