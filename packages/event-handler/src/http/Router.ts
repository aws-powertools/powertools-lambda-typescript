import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type streamWeb from 'node:stream/web';
import type {
  GenericLogger,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import { isRecord } from '@aws-lambda-powertools/commons/typeutils';
import {
  getStringFromEnv,
  isDevMode,
} from '@aws-lambda-powertools/commons/utils/env';
import type {
  ALBEvent,
  ALBResult,
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import type { IStore } from '../store/Store.js';
import { Store } from '../store/Store.js';
import type {
  Env,
  ErrorConstructor,
  ErrorHandler,
  ErrorResolveOptions,
  HandlerOrOptions,
  HttpMethod,
  HttpResolveOptions,
  HttpRouteOptions,
  HttpRouterOptions,
  InferReqSchema,
  InferResBody,
  InferResSchema,
  MergeEnv,
  Middleware,
  MiddlewareOrHandler,
  Path,
  ReqSchema,
  RequestContext,
  RequestStoreOf,
  ResolveStreamOptions,
  ResponseStream,
  ResSchema,
  RouteHandler,
  RouterResponse,
  SharedStoreOf,
  TypedRouteHandler,
  ValidationConfig,
} from '../types/http.js';
import type { HandlerResponse, ResolveOptions } from '../types/index.js';
import { HttpStatusCodes, HttpVerbs } from './constants.js';
import {
  handlerResultToWebResponse,
  proxyEventToWebRequest,
  webHeadersToApiGatewayHeaders,
  webResponseToProxyResult,
} from './converters.js';
import { ErrorHandlerRegistry } from './ErrorHandlerRegistry.js';
import {
  HttpError,
  InvalidEventError,
  InvalidHttpMethodError,
  MethodNotAllowedError,
  NotFoundError,
} from './errors.js';
import { validate } from './middleware/validation.js';
import { Route } from './Route.js';
import { RouteHandlerRegistry } from './RouteHandlerRegistry.js';
import {
  composeMiddleware,
  getBase64EncodingFromHeaders,
  getBase64EncodingFromResult,
  getStatusCode,
  HttpResponseStream,
  isALBEvent,
  isAPIGatewayProxyEventV1,
  isAPIGatewayProxyEventV2,
  isBinaryResult,
  isExtendedAPIGatewayProxyResult,
  resolvePrefixedPath,
  stripTrailingSlashes,
} from './utils.js';

class Router<TEnv extends Env = Env> {
  /**
   * @deprecated This property is deprecated and will be removed in a future major version, please use `requestContext.shared` instead.
   */
  protected context: Record<string, unknown>;

  protected readonly routeRegistry: RouteHandlerRegistry;
  protected readonly errorHandlerRegistry: ErrorHandlerRegistry;
  protected readonly middleware: Middleware[] = [];

  /**
   * A shared store that persists across requests for the lifetime of the Router instance.
   */
  public readonly shared: IStore<SharedStoreOf<TEnv>>;

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

  public constructor(options?: HttpRouterOptions) {
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
    this.shared = new Store<SharedStoreOf<TEnv>>();
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
  public use(middleware: Middleware<TEnv>): void {
    this.middleware.push(middleware);
  }

  #createStoreAccessors(
    requestStore: Store<RequestStoreOf<TEnv>>
  ): Pick<RequestContext<TEnv>, 'set' | 'get' | 'has' | 'delete' | 'shared'> {
    return {
      set: (key, value) => requestStore.set(key, value),
      get: (key) => requestStore.get(key),
      has: (key) => requestStore.has(key),
      delete: (key) => requestStore.delete(key),
      shared: this.shared,
    };
  }

  #buildRequestContext(
    event: APIGatewayProxyEvent | APIGatewayProxyEventV2 | ALBEvent,
    context: Context,
    options: {
      req: Request;
      res: Response;
      isHttpStreaming?: boolean;
    } & Pick<RequestContext<TEnv>, 'set' | 'get' | 'has' | 'delete' | 'shared'>
  ): RequestContext<TEnv> {
    const common = {
      context,
      req: options.req,
      res: options.res,
      route: null as string | null,
      params: {} as Record<string, string>,
      isHttpStreaming: options.isHttpStreaming,
      set: options.set,
      get: options.get,
      has: options.has,
      delete: options.delete,
      shared: options.shared,
    };

    if (isAPIGatewayProxyEventV2(event)) {
      return { ...common, event, responseType: 'ApiGatewayV2' };
    }
    if (isALBEvent(event)) {
      return { ...common, event, responseType: 'ALB' };
    }
    return { ...common, event, responseType: 'ApiGatewayV1' };
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
    options?: HttpResolveOptions
  ): Promise<RequestContext<TEnv>> {
    if (
      !isAPIGatewayProxyEventV1(event) &&
      !isAPIGatewayProxyEventV2(event) &&
      !isALBEvent(event)
    ) {
      this.logger.error(
        'Received an event that is not compatible with this resolver'
      );
      throw new InvalidEventError();
    }

    const requestStore = new Store<RequestStoreOf<TEnv>>();
    const storeAccessors = this.#createStoreAccessors(requestStore);

    let req: Request;
    try {
      req = proxyEventToWebRequest(event);
    } catch (err) {
      if (err instanceof InvalidHttpMethodError) {
        this.logger.error(err);
        // We can't throw a MethodNotAllowedError outside the try block as it
        // will be converted to an internal server error by the API Gateway runtime
        return this.#buildRequestContext(event, context, {
          req: new Request('https://invalid'),
          res: new Response(null, {
            status: HttpStatusCodes.METHOD_NOT_ALLOWED,
            ...(options?.isHttpStreaming && {
              headers: { 'transfer-encoding': 'chunked' },
            }),
          }),
          ...storeAccessors,
        });
      }
      throw err;
    }

    const requestContext = this.#buildRequestContext(event, context, {
      req,
      res: new Response('', {
        status: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ...(options?.isHttpStreaming && {
          headers: { 'transfer-encoding': 'chunked' },
        }),
      }),
      isHttpStreaming: options?.isHttpStreaming,
      ...storeAccessors,
    });

    try {
      const method = req.method as HttpMethod;
      const rawPath = new URL(req.url).pathname;
      const path = (
        rawPath === '/' ? rawPath : stripTrailingSlashes(rawPath)
      ) as Path;

      const route = this.routeRegistry.resolve(method, path);

      if (route !== null) {
        requestContext.route = route.route;
      }

      const handlerMiddleware: Middleware = async ({ reqCtx, next }) => {
        let handlerRes: HandlerResponse;
        if (route === null) {
          handlerRes = await this.handleError(
            new NotFoundError(`Route ${path} for method ${method} not found`),
            { ...reqCtx, scope: options?.scope }
          );
        } else {
          const handler =
            options?.scope == null
              ? route.handler
              : route.handler.bind(options.scope);

          handlerRes = await handler(reqCtx);
        }

        if (getBase64EncodingFromResult(handlerRes)) {
          reqCtx.isBase64Encoded = true;
        }

        reqCtx.res = handlerResultToWebResponse(handlerRes, {
          statusCode: getStatusCode(handlerRes),
          resHeaders: reqCtx.res.headers,
        });

        await next();
      };

      const middleware = composeMiddleware([
        ...this.middleware,
        ...(route?.middleware ?? []),
        handlerMiddleware,
      ]);

      requestContext.params = route?.params ?? {};
      await middleware({
        reqCtx: requestContext,
        next: () => Promise.resolve(),
      });

      return requestContext;
    } catch (error) {
      this.logger.debug(`There was an error processing the request: ${error}`);
      const res = await this.handleError(error as Error, {
        ...requestContext,
        scope: options?.scope,
      });

      if (getBase64EncodingFromResult(res)) {
        requestContext.isBase64Encoded = true;
      }

      requestContext.res = handlerResultToWebResponse(res, {
        statusCode: getStatusCode(res, HttpStatusCodes.INTERNAL_SERVER_ERROR),
        resHeaders: requestContext.res.headers,
      });

      return requestContext;
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
   * @returns An API Gateway proxy result (V1 or V2 format depending on event version)
   */
  public async resolve(
    event: APIGatewayProxyEvent,
    context: Context,
    options?: ResolveOptions
  ): Promise<APIGatewayProxyResult>;
  public async resolve(
    event: APIGatewayProxyEventV2,
    context: Context,
    options?: ResolveOptions
  ): Promise<APIGatewayProxyStructuredResultV2>;
  public async resolve(
    event: ALBEvent,
    context: Context,
    options?: ResolveOptions
  ): Promise<ALBResult>;
  public async resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<RouterResponse>;
  public async resolve(
    event: unknown,
    context: Context,
    options?: ResolveOptions
  ): Promise<RouterResponse> {
    const reqCtx = await this.#resolve(event, context, options);
    const isBase64Encoded =
      reqCtx.isBase64Encoded ??
      getBase64EncodingFromHeaders(reqCtx.res.headers);
    return webResponseToProxyResult(reqCtx.res, reqCtx.responseType, {
      isBase64Encoded,
    });
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
    const reqCtx = await this.#resolve(event, context, {
      ...options,
      isHttpStreaming: true,
    });
    await this.#streamHandlerResponse(reqCtx, options.responseStream);
  }

  /**
   * Streams a handler response to the Lambda response stream.
   * Converts the response to a web response and pipes it through the stream.
   *
   * @param reqCtx - The request context containing the response to stream
   * @param responseStream - The Lambda response stream to write to
   */
  async #streamHandlerResponse(
    reqCtx: RequestContext,
    responseStream: ResponseStream
  ) {
    const { headers } = webHeadersToApiGatewayHeaders(
      reqCtx.res.headers,
      reqCtx.responseType
    );
    const resStream = HttpResponseStream.from(responseStream, {
      statusCode: reqCtx.res.status,
      headers,
    });

    if (reqCtx.res.body) {
      const nodeStream = Readable.fromWeb(
        reqCtx.res.body as streamWeb.ReadableStream
      );
      await pipeline(nodeStream, resStream);
    } else {
      resStream.write('');
      resStream.end();
    }
  }

  public route(
    handler: RouteHandler,
    options: Omit<HttpRouteOptions, 'validation'> & { validation?: never }
  ): void;
  public route<V extends ValidationConfig>(
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: Omit<HttpRouteOptions, 'validation'> & { validation: V }
  ): void;
  public route(
    handler: RouteHandler | TypedRouteHandler,
    options: HttpRouteOptions
  ): void {
    this.#registerRoute(handler, options);
  }

  #registerRoute<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    handler: RouteHandler<TEnv> | TypedRouteHandler<TEnv, TReq, TResBody, TRes>,
    options: HttpRouteOptions
  ): void {
    const { method, path, middleware = [], validation } = options;
    const methods = Array.isArray(method) ? method : [method];
    const resolvedPath = resolvePrefixedPath(path, this.prefix);

    // Create validation middleware if validation config provided
    const allMiddleware = validation
      ? [
          ...middleware,
          validate<TEnv, TReq, TResBody, TRes>(
            validation as ValidationConfig<TReq, TResBody>
          ),
        ]
      : middleware;

    for (const method of methods) {
      this.routeRegistry.register(
        new Route(method, resolvedPath, handler, allMiddleware)
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
        if (
          body instanceof Response ||
          isExtendedAPIGatewayProxyResult(body) ||
          isBinaryResult(body)
        ) {
          return body;
        }
        return this.#errorBodyToWebResponse(body, error);
      } catch (handlerError) {
        if (handlerError instanceof HttpError) {
          return await this.handleError(handlerError, options);
        }
        return this.#defaultErrorHandler(handlerError as Error);
      }
    }

    if (error instanceof HttpError) {
      return error.toWebResponse();
    }

    return this.#defaultErrorHandler(error);
  }

  /**
   * Converts an error handler's response body to an HTTP Response object.
   *
   * If the body is a record object without a status code, sets the status code for
   * NotFoundError (404) or MethodNotAllowedError (405). Uses the status code from
   * the body if present, otherwise defaults to 500 Internal Server Error.
   *
   * @param body - The response body returned by the error handler, of type JSONValue
   * @param error - The Error object associated with the response
   */
  #errorBodyToWebResponse(body: JSONValue, error: Error): Response {
    let status: number = HttpStatusCodes.INTERNAL_SERVER_ERROR;

    if (isRecord(body)) {
      body.statusCode = body.statusCode ?? this.#getStatusCodeFromError(error);
      status = (body.statusCode as number) ?? status;
    }

    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Extracts the HTTP status code from an error instance.
   *
   * Maps specific error types to their corresponding HTTP status codes:
   * - `NotFoundError` maps to 404 (NOT_FOUND)
   * - `MethodNotAllowedError` maps to 405 (METHOD_NOT_ALLOWED)
   *
   * @param error - The error instance to extract the status code from
   */
  #getStatusCodeFromError(error: Error): number | undefined {
    if (error instanceof NotFoundError) {
      return HttpStatusCodes.NOT_FOUND;
    }
    if (error instanceof MethodNotAllowedError) {
      return HttpStatusCodes.METHOD_NOT_ALLOWED;
    }
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

  #handleHttpMethod<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    method: HttpMethod,
    path: Path,
    middlewareOrHandler?: MiddlewareOrHandler<TEnv, TReq, TResBody, TRes>,
    handlerOrOptions?: HandlerOrOptions<TEnv, TReq, TResBody, TRes>,
    options?: { validation: ValidationConfig<TReq, TResBody> }
  ): MethodDecorator | undefined {
    // Case 1: method(path, [middleware], handler, { validation })
    if (Array.isArray(middlewareOrHandler)) {
      if (handlerOrOptions && typeof handlerOrOptions === 'function') {
        this.#registerRoute(handlerOrOptions, {
          method,
          path,
          middleware: middlewareOrHandler,
          ...options,
        });
        return;
      }
      return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
        this.#registerRoute(descriptor.value, {
          method,
          path,
          middleware: middlewareOrHandler,
          ...options,
        });
        return descriptor;
      };
    }

    // Case 2: method(path, handler, { validation }) or method(path, handler)
    if (middlewareOrHandler && typeof middlewareOrHandler === 'function') {
      // Check if handlerOrOptions is an options object (not a function)
      if (
        handlerOrOptions &&
        typeof handlerOrOptions === 'object' &&
        !Array.isArray(handlerOrOptions)
      ) {
        this.#registerRoute(middlewareOrHandler, {
          method,
          path,
          ...handlerOrOptions,
        });
        return;
      }
      // No options provided
      this.#registerRoute(middlewareOrHandler, { method, path });
      return;
    }

    // Case 3: Decorator usage
    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      this.#registerRoute(descriptor.value, { method, path });
      return descriptor;
    };
  }

  public get(path: Path, handler: RouteHandler<TEnv>): void;
  public get(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler<TEnv>
  ): void;
  public get(path: Path): MethodDecorator;
  public get(path: Path, middleware: Middleware[]): MethodDecorator;
  public get<V extends ValidationConfig>(
    path: Path,
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public get<V extends ValidationConfig>(
    path: Path,
    middleware: Middleware[],
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public get<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    path: Path,
    middlewareOrHandler?: MiddlewareOrHandler<TEnv, TReq, TResBody, TRes>,
    handlerOrOptions?: HandlerOrOptions<TEnv, TReq, TResBody, TRes>,
    options?: { validation: ValidationConfig<TReq, TResBody> }
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.GET,
      path,
      middlewareOrHandler,
      handlerOrOptions,
      options
    );
  }

  public post(path: Path, handler: RouteHandler<TEnv>): void;
  public post(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler<TEnv>
  ): void;
  public post(path: Path): MethodDecorator;
  public post(path: Path, middleware: Middleware[]): MethodDecorator;
  public post<V extends ValidationConfig>(
    path: Path,
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public post<V extends ValidationConfig>(
    path: Path,
    middleware: Middleware[],
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public post<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    path: Path,
    middlewareOrHandler?: MiddlewareOrHandler<TEnv, TReq, TResBody, TRes>,
    handlerOrOptions?: HandlerOrOptions<TEnv, TReq, TResBody, TRes>,
    options?: { validation: ValidationConfig<TReq, TResBody> }
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.POST,
      path,
      middlewareOrHandler,
      handlerOrOptions,
      options
    );
  }

  public put(path: Path, handler: RouteHandler<TEnv>): void;
  public put(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler<TEnv>
  ): void;
  public put(path: Path): MethodDecorator;
  public put(path: Path, middleware: Middleware[]): MethodDecorator;
  public put<V extends ValidationConfig>(
    path: Path,
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public put<V extends ValidationConfig>(
    path: Path,
    middleware: Middleware[],
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public put<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    path: Path,
    middlewareOrHandler?: MiddlewareOrHandler<TEnv, TReq, TResBody, TRes>,
    handlerOrOptions?: HandlerOrOptions<TEnv, TReq, TResBody, TRes>,
    options?: { validation: ValidationConfig<TReq, TResBody> }
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.PUT,
      path,
      middlewareOrHandler,
      handlerOrOptions,
      options
    );
  }

  public patch(path: Path, handler: RouteHandler<TEnv>): void;
  public patch(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler<TEnv>
  ): void;
  public patch(path: Path): MethodDecorator;
  public patch(path: Path, middleware: Middleware[]): MethodDecorator;
  public patch<V extends ValidationConfig>(
    path: Path,
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public patch<V extends ValidationConfig>(
    path: Path,
    middleware: Middleware[],
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public patch<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    path: Path,
    middlewareOrHandler?: MiddlewareOrHandler<TEnv, TReq, TResBody, TRes>,
    handlerOrOptions?: HandlerOrOptions<TEnv, TReq, TResBody, TRes>,
    options?: { validation: ValidationConfig<TReq, TResBody> }
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.PATCH,
      path,
      middlewareOrHandler,
      handlerOrOptions,
      options
    );
  }

  public delete(path: Path, handler: RouteHandler<TEnv>): void;
  public delete(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler<TEnv>
  ): void;
  public delete(path: Path): MethodDecorator;
  public delete(path: Path, middleware: Middleware[]): MethodDecorator;
  public delete<V extends ValidationConfig>(
    path: Path,
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public delete<V extends ValidationConfig>(
    path: Path,
    middleware: Middleware[],
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public delete<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    path: Path,
    middlewareOrHandler?: MiddlewareOrHandler<TEnv, TReq, TResBody, TRes>,
    handlerOrOptions?: HandlerOrOptions<TEnv, TReq, TResBody, TRes>,
    options?: { validation: ValidationConfig<TReq, TResBody> }
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.DELETE,
      path,
      middlewareOrHandler,
      handlerOrOptions,
      options
    );
  }

  public head(path: Path, handler: RouteHandler<TEnv>): void;
  public head(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler<TEnv>
  ): void;
  public head(path: Path): MethodDecorator;
  public head(path: Path, middleware: Middleware[]): MethodDecorator;
  public head<V extends ValidationConfig>(
    path: Path,
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public head<V extends ValidationConfig>(
    path: Path,
    middleware: Middleware[],
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public head<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    path: Path,
    middlewareOrHandler?: MiddlewareOrHandler<TEnv, TReq, TResBody, TRes>,
    handlerOrOptions?: HandlerOrOptions<TEnv, TReq, TResBody, TRes>,
    options?: { validation: ValidationConfig<TReq, TResBody> }
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.HEAD,
      path,
      middlewareOrHandler,
      handlerOrOptions,
      options
    );
  }

  public options(path: Path, handler: RouteHandler<TEnv>): void;
  public options(
    path: Path,
    middleware: Middleware[],
    handler: RouteHandler<TEnv>
  ): void;
  public options(path: Path): MethodDecorator;
  public options(path: Path, middleware: Middleware[]): MethodDecorator;
  public options<V extends ValidationConfig>(
    path: Path,
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public options<V extends ValidationConfig>(
    path: Path,
    middleware: Middleware[],
    handler: TypedRouteHandler<
      TEnv,
      InferReqSchema<V>,
      InferResBody<V>,
      InferResSchema<V>
    >,
    options: { validation: V }
  ): void;
  public options<
    TReq extends ReqSchema = ReqSchema,
    TResBody extends HandlerResponse = HandlerResponse,
    TRes extends ResSchema = ResSchema,
  >(
    path: Path,
    middlewareOrHandler?: MiddlewareOrHandler<TEnv, TReq, TResBody, TRes>,
    handlerOrOptions?: HandlerOrOptions<TEnv, TReq, TResBody, TRes>,
    options?: { validation: ValidationConfig<TReq, TResBody> }
  ): MethodDecorator | undefined {
    return this.#handleHttpMethod(
      HttpVerbs.OPTIONS,
      path,
      middlewareOrHandler,
      handlerOrOptions,
      options
    );
  }

  /**
   * Merges the routes, context and middleware from the passed router instance into this router instance.
   *
   * Returns `this` with a widened type that includes the included router's store types,
   * allowing calls to be chained in a fluent style. When chaining multiple `includeRouter`
   * calls, the resulting type is the intersection of all store environments — giving
   * handlers type-safe access to every sub-router's store keys.
   *
   * **Override Behaviors:**
   * - **Context**: Properties from the included router override existing properties with the same key in the current router. A warning is logged when conflicts occur.
   * - **Routes**: Routes from the included router are added to the current router's registry. If a route with the same method and path already exists, the included router's route takes precedence.
   * - **Error Handlers**: Error handlers from the included router are merged with existing handlers. If handlers for the same error type exist in both routers, the included router's handler takes precedence.
   * - **Middleware**: Middleware from the included router is appended to the current router's middleware array. All middleware executes in registration order (current router's middleware first, then included router's middleware).
   *
   * @example
   * ```typescript
   * import { Router } from '@aws-lambda-powertools/event-handler/http';
   *
   * type AuthEnv = { store: { request: { userId: string } } };
   * type FeatureEnv = { store: { shared: { maxResults: number } } };
   *
   * const authRouter = new Router<AuthEnv>();
   * const featureRouter = new Router<FeatureEnv>();
   *
   * // Chained calls merge store types automatically
   * const app = new Router()
   *   .includeRouter(authRouter)
   *   .includeRouter(featureRouter);
   *
   * // Handlers on `app` can now access both `userId` and `maxResults`
   * app.get('/profile', (reqCtx) => {
   *   const userId = reqCtx.get('userId');
   *   const maxResults = reqCtx.shared.get('maxResults');
   *   return { userId, maxResults };
   * });
   * ```
   * @param router - The `Router` from which to merge the routes, context and middleware
   * @param options - Configuration options for merging the router
   * @param options.prefix - An optional prefix to be added to the paths defined in the router
   * @returns The current router instance, typed as `Router<MergeEnv<[TEnv, TOther]>>`
   */
  public includeRouter<TOther extends Env>(
    router: Router<TOther>,
    options?: { prefix: Path }
  ): Router<MergeEnv<[TEnv, TOther]>>;
  public includeRouter(router: Router, options?: { prefix: Path }): Router {
    this.context = {
      ...this.context,
      ...router.context,
    };
    this.routeRegistry.merge(router.routeRegistry, options);
    this.errorHandlerRegistry.merge(router.errorHandlerRegistry);
    this.middleware.push(...router.middleware);

    const shared = this.shared as IStore;
    for (const [key, value] of router.shared.entries()) {
      shared.set(key, value);
    }

    return this;
  }
}

export { Router };
