import { isRecord, isString } from '@aws-lambda-powertools/commons/typeutils';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type {
  CompiledRoute,
  HandlerResponse,
  HttpMethod,
  Middleware,
  Path,
  RequestContext,
  ValidationResult,
} from '../types/rest.js';
import {
  HttpVerbs,
  PARAM_PATTERN,
  SAFE_CHARS,
  UNSAFE_CHARS,
} from './constants.js';

export function compilePath(path: Path): CompiledRoute {
  const paramNames: string[] = [];

  const regexPattern = path.replace(PARAM_PATTERN, (_match, paramName) => {
    paramNames.push(paramName);
    return `(?<${paramName}>[${SAFE_CHARS}${UNSAFE_CHARS}\\w]+)`;
  });

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

  const matches = [...path.matchAll(PARAM_PATTERN)];
  if (path.includes(':')) {
    const expectedParams = path.split(':').length;
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
 * Type guard to check if the provided event is an API Gateway Proxy event.
 *
 * We use this function to ensure that the event is an object and has the
 * required properties without adding a dependency.
 *
 * @param event - The incoming event to check
 */
export const isAPIGatewayProxyEvent = (
  event: unknown
): event is APIGatewayProxyEvent => {
  if (!isRecord(event)) return false;
  return (
    isString(event.httpMethod) &&
    isString(event.path) &&
    isString(event.resource) &&
    isRecord(event.headers) &&
    isRecord(event.requestContext) &&
    typeof event.isBase64Encoded === 'boolean' &&
    (event.body === null || isString(event.body))
  );
};

export const isHttpMethod = (method: string): method is HttpMethod => {
  return Object.keys(HttpVerbs).includes(method);
};

/**
 * Type guard to check if the provided result is an API Gateway Proxy result.
 *
 * We use this function to ensure that the result is an object and has the
 * required properties without adding a dependency.
 *
 * @param result - The result to check
 */
export const isAPIGatewayProxyResult = (
  result: unknown
): result is APIGatewayProxyResult => {
  if (!isRecord(result)) return false;
  return (
    typeof result.statusCode === 'number' &&
    isString(result.body) &&
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
 * const middleware1: Middleware = async (params, options, next) => {
 *   console.log('middleware1 start');
 *   await next();
 *   console.log('middleware1 end');
 * };
 *
 * const middleware2: Middleware = async (params, options, next) => {
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
  return async (
    params: Record<string, string>,
    options: RequestContext,
    next: () => Promise<HandlerResponse | void>
  ): Promise<HandlerResponse | void> => {
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
      const middlewareResult = await middlewareFn(params, options, () =>
        dispatch(i + 1)
      );

      if (middlewareResult !== undefined) {
        result = middlewareResult;
      }
    };

    await dispatch(0);
    return result;
  };
};
