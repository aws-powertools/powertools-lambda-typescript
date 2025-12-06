import type { Readable, Writable } from 'node:stream';
import type {
  GenericLogger,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  ALBEvent,
  ALBResult,
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import type { HttpStatusCodes, HttpVerbs } from '../http/constants.js';
import type { Route } from '../http/Route.js';
import type { ResolveOptions } from './common.js';

type ResponseType = 'ApiGatewayV1' | 'ApiGatewayV2' | 'ALB';

type ResponseTypeMap = {
  ApiGatewayV1: APIGatewayProxyResult;
  ApiGatewayV2: APIGatewayProxyStructuredResultV2;
  ALB: ALBResult;
};

/**
 * Validated request data
 */
type ValidatedRequest<TBody = unknown> = {
  body: TBody;
  headers: Record<string, string>;
  path: Record<string, string>;
  query: Record<string, string>;
};

/**
 * Validated response data
 */
type ValidatedResponse<TBody extends HandlerResponse = HandlerResponse> = {
  body: TBody;
  headers: Record<string, string>;
};

type RequestContext = {
  req: Request;
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2 | ALBEvent;
  context: Context;
  res: Response;
  params: Record<string, string>;
  responseType: ResponseType;
  isBase64Encoded?: boolean;
  isHttpStreaming?: boolean;
};

type TypedRequestContext<
  TReqBody = never,
  TResBody extends HandlerResponse = HandlerResponse,
> = RequestContext & {
  valid: {
    req: ValidatedRequest<TReqBody>;
    res: ValidatedResponse<TResBody>;
  };
};

type HttpResolveOptions = ResolveOptions & { isHttpStreaming?: boolean };

type ErrorResolveOptions = RequestContext & ResolveOptions;

type ErrorHandler<T extends Error = Error> = (
  error: T,
  reqCtx: RequestContext
) => Promise<HandlerResponse>;

interface ErrorConstructor<T extends Error = Error> {
  // biome-ignore lint/suspicious/noExplicitAny: this is a generic type that is intentionally open
  new (...args: any[]): T;
  prototype: T;
}

/**
 * Options for the {@link Router | `Router``} class
 */
type HttpRouterOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger?: GenericLogger;
  /**
   * The base prefix to be used for all routes registered using this Router.
   */
  prefix?: Path;
};

interface CompiledRoute {
  path: Path;
  regex: RegExp;
  paramNames: string[];
  isDynamic: boolean;
}

type DynamicRoute = Route & CompiledRoute;

type BinaryResult = ArrayBuffer | Readable | ReadableStream;

type ExtendedAPIGatewayProxyResultBody = BinaryResult | string;

type ExtendedAPIGatewayProxyResult = Omit<APIGatewayProxyResult, 'body'> & {
  body: ExtendedAPIGatewayProxyResultBody;
  cookies?: string[];
  statusDescription?: string;
};

type HandlerResponse =
  | Response
  | JSONValue
  | ExtendedAPIGatewayProxyResult
  | BinaryResult;

type RouteHandler<TReturn = HandlerResponse> = (
  reqCtx: RequestContext
) => Promise<TReturn> | TReturn;

type TypedRouteHandler<
  TReqBody,
  TResBody extends HandlerResponse = HandlerResponse,
> = (
  reqCtx: TypedRequestContext<TReqBody, TResBody>
) => Promise<TResBody> | TResBody;

type HttpMethod = keyof typeof HttpVerbs;

type HttpStatusCode = (typeof HttpStatusCodes)[keyof typeof HttpStatusCodes];

type Path = `/${string}` | RegExp;

type HttpRouteHandlerOptions = {
  handler: RouteHandler;
  params: Record<string, string>;
  rawParams: Record<string, string>;
  middleware: Middleware[];
};

type HttpRouteOptions = {
  method: HttpMethod | HttpMethod[];
  path: Path;
  middleware?: Middleware[];
  validation?: ValidationConfig;
};

// biome-ignore lint/suspicious/noConfusingVoidType: To ensure next function is awaited
type NextFunction = () => Promise<HandlerResponse | void>;

type Middleware = (args: {
  reqCtx: RequestContext | TypedRequestContext;
  next: NextFunction;
  // biome-ignore lint/suspicious/noConfusingVoidType: To ensure next function is awaited
}) => Promise<HandlerResponse | void>;

type RouteRegistryOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
};

type ErrorHandlerRegistryOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;
};

type ValidationResult = {
  isValid: boolean;
  issues: string[];
};

interface ResponseStream extends Writable {
  setContentType(contentType: string): void;
  _onBeforeFirstWrite?: (writeFn: (chunk: unknown) => void) => void;
  getBuffer?: () => Buffer;
}

type V1Headers = {
  headers: Record<string, string>;
  multiValueHeaders: Record<string, string[]>;
};

/**
 * Object to pass to the {@link Router.resolveStream | `Router.resolveStream()`} method.
 */
type ResolveStreamOptions = {
  /**
   * Reference to `this` instance of the class that is calling the `resolveStream` method.
   *
   * This parameter should be used only when using {@link Router} route decorators like
   * {@link Router.get | `Router.get()`}, {@link Router.post | `Router.post()`}, etc. as class method decorators, and
   * it's used to bind the decorated methods to your class instance.
   *
   * @example
   * ```ts
   * import { Router } from '@aws-lambda-powertools/event-handler/http';
   *
   * const app = new Router();
   *
   * class Lambda {
   *   public scope = 'scoped';
   *
   *   @app.get('/test')
   *   public async getTest() {
   *     return { message: `${this.scope}: success` };
   *   }
   *
   *   public async handler(event: unknown, context: Context, responseStream: ResponseStream) {
   *     return app.resolveStream(event, context, { scope: this, responseStream });
   *   }
   * }
   * const lambda = new Lambda();
   * const handler = lambda.handler.bind(lambda);
   * ```
   */
  scope?: unknown;
  /**
   * The Lambda response stream used for streaming responses directly to the client.
   * This stream is provided by the AWS Lambda runtime for response streaming.
   */
  responseStream: ResponseStream;
};

/**
 * Configuration options for CORS middleware
 */
type CorsOptions = {
  /**
   * The Access-Control-Allow-Origin header value.
   * Can be a string, array of strings.
   * @default '*'
   */
  origin?: string | string[];

  /**
   * The Access-Control-Allow-Methods header value.
   * @default ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT']
   */
  allowMethods?: string[];

  /**
   * The Access-Control-Allow-Headers header value.
   * @default ['Authorization', 'Content-Type', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token']
   */
  allowHeaders?: string[];

  /**
   * The Access-Control-Expose-Headers header value.
   * @default []
   */
  exposeHeaders?: string[];

  /**
   * The Access-Control-Allow-Credentials header value.
   * @default false
   */
  credentials?: boolean;

  /**
   * The Access-Control-Max-Age header value in seconds.
   * Only applicable for preflight requests.
   */
  maxAge?: number;
};

type CompressionOptions = {
  encoding?: 'gzip' | 'deflate';
  threshold?: number;
};

/**
 * Configuration options for Tracer middleware
 */
type TracerOptions = {
  /**
   * Whether to capture the response body as metadata.
   * @default true
   */
  captureResponse?: boolean;
  /**
   * A logger instance to be used for logging.
   *
   * When no logger is provided, we'll only log using the global `console` object.
   */
  logger?: GenericLogger;
};

type WebResponseToProxyResultOptions = {
  isBase64Encoded?: boolean;
};

type RouterResponse =
  | APIGatewayProxyResult
  | APIGatewayProxyStructuredResultV2
  | ALBResult;

/**
 * Configuration for request validation.
 * At least one of body, headers, path, or query must be provided.
 */
type RequestValidationConfig<T = unknown> =
  | {
      body: StandardSchemaV1<unknown, T>;
      headers?: StandardSchemaV1<unknown, Record<string, string>>;
      path?: StandardSchemaV1<unknown, Record<string, string>>;
      query?: StandardSchemaV1<unknown, Record<string, string>>;
    }
  | {
      body?: StandardSchemaV1<unknown, T>;
      headers: StandardSchemaV1<unknown, Record<string, string>>;
      path?: StandardSchemaV1<unknown, Record<string, string>>;
      query?: StandardSchemaV1<unknown, Record<string, string>>;
    }
  | {
      body?: StandardSchemaV1<unknown, T>;
      headers?: StandardSchemaV1<unknown, Record<string, string>>;
      path: StandardSchemaV1<unknown, Record<string, string>>;
      query?: StandardSchemaV1<unknown, Record<string, string>>;
    }
  | {
      body?: StandardSchemaV1<unknown, T>;
      headers?: StandardSchemaV1<unknown, Record<string, string>>;
      path?: StandardSchemaV1<unknown, Record<string, string>>;
      query: StandardSchemaV1<unknown, Record<string, string>>;
    };

/**
 * Configuration for response validation.
 * At least one of body or headers must be provided.
 */
type ResponseValidationConfig<T extends HandlerResponse = HandlerResponse> =
  | {
      body: StandardSchemaV1<HandlerResponse, T>;
      headers?: StandardSchemaV1<
        Record<string, string>,
        Record<string, string>
      >;
    }
  | {
      body?: StandardSchemaV1<HandlerResponse, T>;
      headers: StandardSchemaV1<Record<string, string>, Record<string, string>>;
    };

/**
 * Validation configuration for request and response.
 * At least one of req or res must be provided.
 */
type ValidationConfig<
  TReqBody = unknown,
  TResBody extends HandlerResponse = HandlerResponse,
> =
  | {
      req: RequestValidationConfig<TReqBody>;
      res?: ResponseValidationConfig<TResBody>;
    }
  | {
      req?: RequestValidationConfig<TReqBody>;
      res: ResponseValidationConfig<TResBody>;
    };

/**
 * Validation error details
 */
type ValidationErrorDetail = {
  component: 'body' | 'headers' | 'path' | 'query';
  message: string;
};

export type {
  BinaryResult,
  ExtendedAPIGatewayProxyResult,
  ExtendedAPIGatewayProxyResultBody,
  CompiledRoute,
  CorsOptions,
  DynamicRoute,
  ErrorConstructor,
  ErrorHandlerRegistryOptions,
  ErrorHandler,
  ErrorResolveOptions,
  HandlerResponse,
  HttpResolveOptions,
  HttpStatusCode,
  HttpMethod,
  Middleware,
  Path,
  RequestContext,
  TypedRequestContext,
  ResponseType,
  ResponseTypeMap,
  HttpRouterOptions,
  RouteHandler,
  ResolveStreamOptions,
  ResponseStream,
  HttpRouteOptions,
  HttpRouteHandlerOptions,
  RouteRegistryOptions,
  RouterResponse,
  TracerOptions,
  ValidationResult,
  CompressionOptions,
  NextFunction,
  V1Headers,
  WebResponseToProxyResultOptions,
  RequestValidationConfig,
  ResponseValidationConfig,
  ValidationConfig,
  ValidationErrorDetail,
  ValidatedRequest,
  ValidatedResponse,
  TypedRouteHandler,
};
