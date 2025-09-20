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
  Middleware,
  Path,
  RequestContext,
  RestRouteOptions,
  RestRouterOptions,
  RouteHandler,
} from '../types/rest.js';
import { HttpErrorCodes, HttpVerbs } from './constants.js';
import {
  handlerResultToProxyResult,
  handlerResultToWebResponse,
  proxyEventToWebRequest,
  webResponseToProxyResult,
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
import {
  composeMiddleware,
  isAPIGatewayProxyEvent,
  isHttpMethod,
} from './utils.js';

class Router {
  protected context: Record<string, unknown>;

  protected readonly routeRegistry: RouteHandlerRegistry;
  protected readonly errorHandlerRegistry: ErrorHandlerRegistry;
  protected readonly middleware: Middleware[] = [];

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

  public constructor(options?: RestRouterOptions) {
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
   * @param handler - The error handler that returns an error response
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
   * @param handler - The error handler that returns an error
   * response
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
   * @param handler - The error handler that returns an error response
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
   * Registers a global middleware function that will be executed for all routes.
   *
   * Global middleware executes before route-specific middleware and follows the onion model
   * where middleware executes in registration order before `next()` and in reverse order after `next()`.
   *
   * @param middleware - The middleware function to register globally
   *
   * @example
   * ```typescript
   * const authMiddleware: Middleware = async (params, reqCtx, next) => {
   *   // Authentication logic
   *   if (!isAuthenticated(reqCtx.request)) {
   *     return new Response('Unauthorized', { status: 401 });
   *   }
   *   await next();
   *   // Cleanup or logging after request completion
   *   console.log('Request completed');
   * };
   *
   * router.use(authMiddleware);
   * ```
   */
  public use(middleware: Middleware): void {
    this.middleware.push(middleware);
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
   * @returns An API Gateway proxy result
   */
  public async resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<APIGatewayProxyResult> {
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

    const requestContext: RequestContext = {
      event,
      context,
      request,
      // this response should be overwritten by the handler, if it isn't
      // it means something went wrong with the middleware chain
      res: new Response('', { status: 500 }),
    };

    try {
      const path = new URL(request.url).pathname as Path;

      const route = this.routeRegistry.resolve(method, path);

      const handlerMiddleware: Middleware = async (params, reqCtx, next) => {
        if (route === null) {
          const notFoundRes = await this.handleError(
            new NotFoundError(`Route ${path} for method ${method} not found`),
            { ...reqCtx, scope: options?.scope }
          );
          reqCtx.res = handlerResultToWebResponse(
            notFoundRes,
            reqCtx.res.headers
          );
        } else {
          const handler =
            options?.scope != null
              ? route.handler.bind(options.scope)
              : route.handler;

          const handlerResult = await handler(params, reqCtx);
          reqCtx.res = handlerResultToWebResponse(
            handlerResult,
            reqCtx.res.headers
          );
        }

        await next();
      };

      const middleware = composeMiddleware([
        ...this.middleware,
        ...(route?.middleware ?? []),
        handlerMiddleware,
      ]);

      const middlewareResult = await middleware(
        route?.params ?? {},
        requestContext,
        () => Promise.resolve()
      );

      // middleware result takes precedence to allow short-circuiting
      const result = middlewareResult ?? requestContext.res;

      return handlerResultToProxyResult(result);
    } catch (error) {
      this.logger.debug(`There was an error processing the request: ${error}`);
      const result = await this.handleError(error as Error, {
        ...requestContext,
        scope: options?.scope,
      });
      return await webResponseToProxyResult(result);
    }
  }

  public route(handler: RouteHandler, options: RestRouteOptions): void {
    const { method, path, middleware = [] } = options;
    const methods = Array.isArray(method) ? method : [method];

    for (const method of methods) {
      this.routeRegistry.register(new Route(method, path, handler, middleware));
    }
  }

  /**
   * Handles errors by finding a registered error handler or falling
   * back to a default handler.
   *
   * @param error - The error to handle
   * @param options - Error resolve options including request context and scope
   * @returns A Response object with appropriate status code and error details
   */
  protected async handleError(
    error: Error,
    options: ErrorResolveOptions
  ): Promise<Response> {
    const handler = this.errorHandlerRegistry.resolve(error);
    if (handler !== null) {
      try {
        const { scope, ...reqCtx } = options;
        const body = await handler.apply(scope ?? this, [error, reqCtx]);
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
    middlewareOrHandler?: Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    if (Array.isArray(middlewareOrHandler)) {
      if (handler && typeof handler === 'function') {
        this.route(handler, { method, path, middleware: middlewareOrHandler });
        return;
      }
      return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
        this.route(descriptor.value, {
          method,
          path,
          middleware: middlewareOrHandler,
        });
        return descriptor;
      };
    }

    if (middlewareOrHandler && typeof middlewareOrHandler === 'function') {
      this.route(middlewareOrHandler, { method, path });
      return;
    }

    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.route(descriptor.value, { method, path });
      return descriptor;
    };
  }

  public get(path: Path, handler: RouteHandler): void;
  public get(path: Path, middleware: Middleware[], handler: RouteHandler): void;
  public get(path: Path): MethodDecorator;
  public get(path: Path, middleware: Middleware[]): MethodDecorator;
  public get(
    path: Path,
    middlewareOrHandler?: Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.GET,
      path,
      middlewareOrHandler,
      handler
    );
  }

  public post(path: Path, handler: RouteHandler): void;
  public post(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler
  ): void;
  public post(path: Path): MethodDecorator;
  public post(path: Path, middleware: Middleware[]): MethodDecorator;
  public post(
    path: Path,
    middlewareOrHandler?: Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.POST,
      path,
      middlewareOrHandler,
      handler
    );
  }

  public put(path: Path, handler: RouteHandler): void;
  public put(path: Path, middleware: Middleware[], handler: RouteHandler): void;
  public put(path: Path): MethodDecorator;
  public put(path: Path, middleware: Middleware[]): MethodDecorator;
  public put(
    path: Path,
    middlewareOrHandler?: Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.PUT,
      path,
      middlewareOrHandler,
      handler
    );
  }

  public patch(path: Path, handler: RouteHandler): void;
  public patch(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler
  ): void;
  public patch(path: Path): MethodDecorator;
  public patch(path: Path, middleware: Middleware[]): MethodDecorator;
  public patch(
    path: Path,
    middlewareOrHandler?: Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.PATCH,
      path,
      middlewareOrHandler,
      handler
    );
  }

  public delete(path: Path, handler: RouteHandler): void;
  public delete(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler
  ): void;
  public delete(path: Path): MethodDecorator;
  public delete(path: Path, middleware: Middleware[]): MethodDecorator;
  public delete(
    path: Path,
    middlewareOrHandler?: Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.DELETE,
      path,
      middlewareOrHandler,
      handler
    );
  }

  public head(path: Path, handler: RouteHandler): void;
  public head(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler
  ): void;
  public head(path: Path): MethodDecorator;
  public head(path: Path, middleware: Middleware[]): MethodDecorator;
  public head(
    path: Path,
    middlewareOrHandler?: Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.HEAD,
      path,
      middlewareOrHandler,
      handler
    );
  }

  public options(path: Path, handler: RouteHandler): void;
  public options(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler
  ): void;
  public options(path: Path): MethodDecorator;
  public options(path: Path, middleware: Middleware[]): MethodDecorator;
  public options(
    path: Path,
    middlewareOrHandler?: Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.OPTIONS,
      path,
      middlewareOrHandler,
      handler
    );
  }
}

export { Router };
