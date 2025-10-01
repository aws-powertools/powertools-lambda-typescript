import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type streamWeb from 'node:stream/web';
import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import {
  getStringFromEnv,
  isDevMode,
} from '@aws-lambda-powertools/commons/utils/env';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import type { HandlerResponse, ResolveOptions } from '../types/index.js';
import type {
  ErrorConstructor,
  ErrorHandler,
  ErrorResolveOptions,
  HttpMethod,
  Middleware,
  Path,
  RequestContext,
  ResolveStreamOptions,
  ResponseStream,
  RestRouteOptions,
  RestRouterOptions,
  RouteHandler,
} from '../types/rest.js';
import { HttpStatusCodes, HttpVerbs } from './constants.js';
import {
  handlerResultToProxyResult,
  handlerResultToWebResponse,
  proxyEventToWebRequest,
  webHeadersToApiGatewayV1Headers,
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
  HttpResponseStream,
  isAPIGatewayProxyEvent,
  isExtendedAPIGatewayProxyResult,
  isHttpMethod,
  resolvePrefixedPath,
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
  /**
   * The base prefix to be used for all routes registered using this Router.
   */
  protected readonly prefix?: Path;

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
    this.prefix = options?.prefix;
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
   * const authMiddleware: Middleware = async ({ params, reqCtx, next }) => {
   *   // Authentication logic
   *   if (!isAuthenticated(reqCtx.req)) {
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
   * Core resolution logic shared by both resolve and resolveStream methods.
   * Validates the event, routes to handlers, executes middleware, and handles errors.
   *
   * @param event - The Lambda event to resolve
   * @param context - The Lambda context
   * @param options - Optional resolve options for scope binding
   * @returns A handler response (Response, JSONObject, or ExtendedAPIGatewayProxyResult)
   */
  async #resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<HandlerResponse> {
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
        statusCode: HttpStatusCodes.METHOD_NOT_ALLOWED,
        body: '',
      };
    }

    const req = proxyEventToWebRequest(event);

    const requestContext: RequestContext = {
      event,
      context,
      req,
      // this response should be overwritten by the handler, if it isn't
      // it means something went wrong with the middleware chain
      res: new Response('', { status: 500 }),
      params: {},
    };

    try {
      const path = new URL(req.url).pathname as Path;

      const route = this.routeRegistry.resolve(method, path);

      const handlerMiddleware: Middleware = async ({ reqCtx, next }) => {
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
            options?.scope == null
              ? route.handler
              : route.handler.bind(options.scope);

          const handlerResult = await handler(reqCtx);
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

      requestContext.params = route?.params ?? {};
      const middlewareResult = await middleware({
        reqCtx: requestContext,
        next: () => Promise.resolve(),
      });

      // middleware result takes precedence to allow short-circuiting
      return middlewareResult ?? requestContext.res;
    } catch (error) {
      this.logger.debug(`There was an error processing the request: ${error}`);
      return this.handleError(error as Error, {
        ...requestContext,
        scope: options?.scope,
      });
    }
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
    const result = await this.#resolve(event, context, options);
    return handlerResultToProxyResult(result);
  }

  /**
   * Resolves an API Gateway event by routing it to the appropriate handler
   * and streaming the response directly to the provided response stream.
   * Used for Lambda response streaming.
   *
   * @param event - The Lambda event to resolve
   * @param context - The Lambda context
   * @param options - Stream resolve options including the response stream
   */
  public async resolveStream(
    event: unknown,
    context: Context,
    options: ResolveStreamOptions
  ): Promise<void> {
    const result = await this.#resolve(event, context, options);
    await this.#streamHandlerResponse(result, options.responseStream);
  }

  /**
   * Streams a handler response to the Lambda response stream.
   * Converts the response to a web response and pipes it through the stream.
   *
   * @param response - The handler response to stream
   * @param responseStream - The Lambda response stream to write to
   */
  async #streamHandlerResponse(
    response: HandlerResponse,
    responseStream: ResponseStream
  ) {
    const webResponse = handlerResultToWebResponse(response);
    const { headers } = webHeadersToApiGatewayV1Headers(webResponse.headers);
    const resStream = HttpResponseStream.from(responseStream, {
      statusCode: webResponse.status,
      headers,
    });

    if (webResponse.body) {
      const nodeStream = Readable.fromWeb(
        webResponse.body as streamWeb.ReadableStream
      );
      await pipeline(nodeStream, resStream);
    } else {
      resStream.write('');
    }
  }

  public route(handler: RouteHandler, options: RestRouteOptions): void {
    const { method, path, middleware = [] } = options;
    const methods = Array.isArray(method) ? method : [method];
    const resolvedPath = resolvePrefixedPath(path, this.prefix);

    for (const method of methods) {
      this.routeRegistry.register(
        new Route(method, resolvedPath, handler, middleware)
      );
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
  ): Promise<HandlerResponse> {
    const handler = this.errorHandlerRegistry.resolve(error);
    if (handler !== null) {
      try {
        const { scope, ...reqCtx } = options;
        const body = await handler.apply(scope ?? this, [error, reqCtx]);
        if (body instanceof Response || isExtendedAPIGatewayProxyResult(body)) {
          return body;
        }
        if (!body.statusCode) {
          if (error instanceof NotFoundError) {
            body.statusCode = HttpStatusCodes.NOT_FOUND;
          } else if (error instanceof MethodNotAllowedError) {
            body.statusCode = HttpStatusCodes.METHOD_NOT_ALLOWED;
          }
        }
        return new Response(JSON.stringify(body), {
          status:
            (body.statusCode as number) ??
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (handlerError) {
        if (handlerError instanceof ServiceError) {
          return await this.handleError(handlerError, options);
        }
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

  /**
   * Merges the routes, context and middleware from the passed router instance into this router instance.
   *
   * **Override Behaviors:**
   * - **Context**: Properties from the included router override existing properties with the same key in the current router. A warning is logged when conflicts occur.
   * - **Routes**: Routes from the included router are added to the current router's registry. If a route with the same method and path already exists, the included router's route takes precedence.
   * - **Error Handlers**: Error handlers from the included router are merged with existing handlers. If handlers for the same error type exist in both routers, the included router's handler takes precedence.
   * - **Middleware**: Middleware from the included router is appended to the current router's middleware array. All middleware executes in registration order (current router's middleware first, then included router's middleware).
   *
   * @example
   * ```typescript
   * import { Router } from '@aws-lambda-powertools/event-handler/experimental-rest';
   *
   * const todosRouter = new Router();
   *
   * todosRouter.get('/todos', async () => {
   *   // List API
   * });
   *
   * todosRouter.get('/todos/{todoId}', async () => {
   *   // Get API
   * });
   *
   * const app = new Router();
   * app.includeRouter(todosRouter);
   *
   * export const handler = async (event: unknown, context: Context) => {
   *   return app.resolve(event, context);
   * };
   * ```
   * @param router - The `Router` from which to merge the routes, context and middleware
   * @param options - Configuration options for merging the router
   * @param options.prefix - An optional prefix to be added to the paths defined in the router
   */
  public includeRouter(router: Router, options?: { prefix: Path }): void {
    this.context = {
      ...this.context,
      ...router.context,
    };
    this.routeRegistry.merge(router.routeRegistry, options);
    this.errorHandlerRegistry.merge(router.errorHandlerRegistry);
    this.middleware.push(...router.middleware);
  }
}

export { Router };
