import { Duplex, Readable, Writable } from 'node:stream';
import {
  isRecord,
  isRegExp,
  isString,
} from '@aws-lambda-powertools/commons/typeutils';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  StreamifyHandler,
} from 'aws-lambda';
import type { Router } from '../rest/Router.js';
import type { ResolveOptions } from '../types/index.js';
import type {
  CompiledRoute,
  CompressionOptions,
  ExtendedAPIGatewayProxyResult,
  HandlerResponse,
  HttpMethod,
  HttpStatusCode,
  Middleware,
  Path,
  ResponseStream,
  ValidationResult,
} from '../types/rest.js';
import {
  COMPRESSION_ENCODING_TYPES,
  HttpStatusCodes,
  HttpVerbs,
  PARAM_PATTERN,
  SAFE_CHARS,
  UNSAFE_CHARS,
} from './constants.js';

export function getPathString(path: Path): string {
  return isString(path) ? path : path.source.replaceAll(/\\\//g, '/');
}

export function compilePath(path: Path): CompiledRoute {
  const paramNames: string[] = [];

  const pathString = getPathString(path);
  const regexPattern = pathString.replace(
    PARAM_PATTERN,
    (_match, paramName) => {
      paramNames.push(paramName);
      return `(?<${paramName}>[${SAFE_CHARS}${UNSAFE_CHARS}\\w]+)`;
    }
  );

  const finalPattern = `^${regexPattern}$`;

  return {
    path,
    regex: new RegExp(finalPattern),
    paramNames,
    isDynamic: paramNames.length > 0,
  };
}

export function validatePathPattern(path: Path): ValidationResult {
  const issues: string[] = [];

  const pathString = getPathString(path);
  const matches = [...pathString.matchAll(PARAM_PATTERN)];
  if (pathString.includes(':')) {
    const expectedParams = pathString.split(':').length;
    if (matches.length !== expectedParams - 1) {
      issues.push('Malformed parameter syntax. Use :paramName format.');
    }

    const paramNames = matches.map((match) => match[1]);
    const duplicates = paramNames.filter(
      (param, index) => paramNames.indexOf(param) !== index
    );
    if (duplicates.length > 0) {
      issues.push(`Duplicate parameter names: ${duplicates.join(', ')}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Type guard to check if the provided event is an API Gateway Proxy V1 event.
 *
 * We use this function to ensure that the event is an object and has the
 * required properties without adding a dependency.
 *
 * @param event - The incoming event to check
 */
export const isAPIGatewayProxyEventV1 = (
  event: unknown
): event is APIGatewayProxyEvent => {
  if (!isRecord(event)) return false;
  return (
    isString(event.httpMethod) &&
    isString(event.path) &&
    isString(event.resource) &&
    (event.headers == null || isRecord(event.headers)) &&
    (event.multiValueHeaders == null || isRecord(event.multiValueHeaders)) &&
    isRecord(event.requestContext) &&
    typeof event.isBase64Encoded === 'boolean' &&
    (event.body === null || isString(event.body)) &&
    (event.pathParameters === null || isRecord(event.pathParameters)) &&
    (event.queryStringParameters === null ||
      isRecord(event.queryStringParameters)) &&
    (event.multiValueQueryStringParameters === null ||
      isRecord(event.multiValueQueryStringParameters)) &&
    (event.stageVariables === null || isRecord(event.stageVariables))
  );
};

/**
 * Type guard to check if the provided event is an API Gateway Proxy V2 event.
 *
 * @param event - The incoming event to check
 */
export const isAPIGatewayProxyEventV2 = (
  event: unknown
): event is APIGatewayProxyEventV2 => {
  if (!isRecord(event)) return false;
  return (
    event.version === '2.0' &&
    isString(event.routeKey) &&
    isString(event.rawPath) &&
    isString(event.rawQueryString) &&
    isRecord(event.headers) &&
    isRecord(event.requestContext) &&
    typeof event.isBase64Encoded === 'boolean' &&
    (event.body === undefined || isString(event.body)) &&
    (event.pathParameters === undefined || isRecord(event.pathParameters)) &&
    (event.queryStringParameters === undefined ||
      isRecord(event.queryStringParameters)) &&
    (event.stageVariables === undefined || isRecord(event.stageVariables)) &&
    (event.cookies === undefined || Array.isArray(event.cookies))
  );
};

export const isHttpMethod = (method: string): method is HttpMethod => {
  return Object.keys(HttpVerbs).includes(method);
};

export const isNodeReadableStream = (value: unknown): value is Readable => {
  return (
    value != null &&
    typeof value === 'object' &&
    (value instanceof Readable || value instanceof Duplex) &&
    'readable' in value &&
    'read' in value &&
    typeof value.read === 'function'
  );
};

export const isWebReadableStream = (
  value: unknown
): value is ReadableStream => {
  return (
    value != null &&
    typeof value === 'object' &&
    'getReader' in value &&
    typeof (value as Record<string, unknown>).getReader === 'function'
  );
};

export const isBinaryResult = (
  value: unknown
): value is ArrayBuffer | Readable | ReadableStream => {
  return (
    value instanceof ArrayBuffer ||
    isNodeReadableStream(value) ||
    isWebReadableStream(value)
  );
};

/**
 * Type guard to check if the provided result is an API Gateway Proxy result.
 *
 * We use this function to ensure that the result is an object and has the
 * required properties without adding a dependency.
 *
 * @param result - The result to check
 */
export const isExtendedAPIGatewayProxyResult = (
  result: unknown
): result is ExtendedAPIGatewayProxyResult => {
  if (!isRecord(result)) return false;
  return (
    typeof result.statusCode === 'number' &&
    (isString(result.body) ||
      isNodeReadableStream(result.body) ||
      isWebReadableStream(result.body)) &&
    (result.headers === undefined || isRecord(result.headers)) &&
    (result.multiValueHeaders === undefined ||
      isRecord(result.multiValueHeaders)) &&
    (result.isBase64Encoded === undefined ||
      typeof result.isBase64Encoded === 'boolean')
  );
};

/**
 * Composes multiple middleware functions into a single middleware function.
 *
 * Middleware functions are executed in order, with each middleware having the ability
 * to call `next()` to proceed to the next middleware in the chain. The composed middleware
 * follows the onion model where middleware executes in order before `next()` and in
 * reverse order after `next()`.
 *
 * @param middleware - Array of middleware functions to compose
 * @returns A single middleware function that executes all provided middleware in sequence
 *
 * @example
 * ```typescript
 * const middleware1: Middleware = async ({params, options, next}) => {
 *   console.log('middleware1 start');
 *   await next();
 *   console.log('middleware1 end');
 * };
 *
 * const middleware2: Middleware = async ({params, options, next}) => {
 *   console.log('middleware2 start');
 *   await next();
 *   console.log('middleware2 end');
 * };
 *
 * const composed: Middleware = composeMiddleware([middleware1, middleware2]);
 * // Execution order:
 * //   middleware1 start
 * //   -> middleware2 start
 * //   -> handler
 * //   -> middleware2 end
 * //   -> middleware1 end
 * ```
 */
export const composeMiddleware = (middleware: Middleware[]): Middleware => {
  return async ({ reqCtx, next }) => {
    let index = -1;
    let result: HandlerResponse | undefined;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;

      if (i === middleware.length) {
        const nextResult = await next();
        if (nextResult !== undefined) {
          result = nextResult;
        }
        return;
      }

      const middlewareFn = middleware[i];
      let nextPromise: Promise<void> | null = null;
      let nextAwaited = false;
      const nextFn = async () => {
        nextPromise = dispatch(i + 1);
        const result = await nextPromise;
        nextAwaited = true;
        return result;
      };

      const middlewareResult = await middlewareFn({
        reqCtx,
        next: nextFn,
      });

      if (nextPromise && !nextAwaited && i < middleware.length - 1) {
        throw new Error(
          'Middleware called next() without awaiting. This may lead to unexpected behavior.'
        );
      }

      if (middlewareResult !== undefined) {
        result = middlewareResult;
      }
    };

    await dispatch(0);
    return result;
  };
};

/**
 * Resolves a prefixed path by combining the provided path and prefix.
 *
 * The function returns a RegExp if any of the path or prefix is a RegExp.
 * Otherwise, it returns a `/${string}` type value.
 *
 * @param path - The path to resolve
 * @param prefix - The prefix to prepend to the path
 */
export const resolvePrefixedPath = (path: Path, prefix?: Path): Path => {
  if (!prefix) return path;
  if (isRegExp(prefix)) {
    if (isRegExp(path)) {
      return new RegExp(`${getPathString(prefix)}/${getPathString(path)}`);
    }
    return new RegExp(`${getPathString(prefix)}${path}`);
  }
  if (isRegExp(path)) {
    return new RegExp(`${prefix}/${getPathString(path)}`);
  }
  return `${prefix}${path}`.replace(/\/$/, '') as Path;
};

export const HttpResponseStream =
  globalThis.awslambda?.HttpResponseStream ??
  class LocalHttpResponseStream extends Writable {
    #contentType: string | undefined;

    setContentType(contentType: string) {
      this.#contentType = contentType;
    }

    static from(
      underlyingStream: ResponseStream,
      prelude: Record<string, string>
    ) {
      underlyingStream.setContentType(
        "'application/vnd.awslambda.http-integration-response'"
      );

      // JSON.stringify is required. NULL byte is not allowed in metadataPrelude.
      const metadataPrelude = JSON.stringify(prelude);

      underlyingStream._onBeforeFirstWrite = (
        write: (data: Uint8Array | string) => void
      ) => {
        write(metadataPrelude);

        // Write 8 null bytes after the JSON prelude.
        write(new Uint8Array(8));
      };

      return underlyingStream;
    }
  };

export const getBase64EncodingFromResult = (result: HandlerResponse) => {
  if (isBinaryResult(result)) {
    return true;
  }
  if (isExtendedAPIGatewayProxyResult(result)) {
    return isBinaryResult(result);
  }
  return false;
};

export const getBase64EncodingFromHeaders = (headers: Headers): boolean => {
  const contentEncoding = headers.get(
    'content-encoding'
  ) as CompressionOptions['encoding'];

  if (
    contentEncoding != null &&
    [
      COMPRESSION_ENCODING_TYPES.GZIP,
      COMPRESSION_ENCODING_TYPES.DEFLATE,
    ].includes(contentEncoding)
  ) {
    return true;
  }

  const contentType = headers.get('content-type');
  /* v8 ignore else -- @preserve */
  if (contentType != null) {
    const type = contentType.split(';')[0].trim();
    if (
      type.startsWith('image/') ||
      type.startsWith('audio/') ||
      type.startsWith('video/')
    ) {
      return true;
    }
  }

  return false;
};

export const getStatusCode = (
  result: HandlerResponse,
  fallback: HttpStatusCode = HttpStatusCodes.OK
): HttpStatusCode => {
  if (result instanceof Response) {
    return result.status as HttpStatusCode;
  }
  if (isExtendedAPIGatewayProxyResult(result)) {
    return result.statusCode as HttpStatusCode;
  }
  return fallback;
};

const streamifyResponse =
  globalThis.awslambda?.streamifyResponse ??
  (<TEvent = unknown, TResult = void>(
    handler: StreamifyHandler<TEvent, TResult>
  ): StreamifyHandler<TEvent, TResult> => {
    return (async (event, responseStream, context) => {
      await handler(event, responseStream, context);

      /* v8 ignore else -- @preserve */
      if ('chunks' in responseStream && Array.isArray(responseStream.chunks)) {
        const output = Buffer.concat(responseStream.chunks as Buffer[]);
        const nullBytes = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);
        const separatorIndex = output.indexOf(nullBytes);

        const preludeBuffer = output.subarray(0, separatorIndex);
        const bodyBuffer = output.subarray(separatorIndex + 8);
        const prelude = JSON.parse(preludeBuffer.toString());

        return {
          body: bodyBuffer.toString(),
          headers: prelude.headers,
          statusCode: prelude.statusCode,
        } as TResult;
      }
    }) as StreamifyHandler<TEvent, TResult>;
  });

/**
 * Wraps a Router instance to create a Lambda handler that uses response streaming.
 *
 * In Lambda runtime, uses `awslambda.streamifyResponse` to enable streaming responses.
 * In test/local environments, returns an unwrapped handler that works with mock streams.
 *
 * @param router - The Router instance to wrap
 * @param options - Optional configuration including scope for decorator binding
 * @returns A Lambda handler that streams responses
 *
 * @example
 * ```typescript
 * import { Router, streamify } from '@aws-lambda-powertools/event-handler/experimental-rest';
 *
 * const app = new Router();
 * app.get('/test', () => ({ message: 'Hello' }));
 *
 * export const handler = streamify(app);
 * ```
 *
 * @example
 * ```typescript
 * // With scope for decorators
 * class Lambda {
 *   public scope = 'my-scope';
 *
 *   @app.get('/test')
 *   public getTest() {
 *     return { message: `${this.scope}: success` };
 *   }
 *
 *   public handler = streamify(app, { scope: this });
 * }
 * ```
 */
export const streamify = (
  router: Router,
  options?: ResolveOptions
): StreamifyHandler => {
  return streamifyResponse(async (event, responseStream, context) => {
    await router.resolveStream(event, context, {
      responseStream,
      scope: options?.scope,
    });
  });
};
