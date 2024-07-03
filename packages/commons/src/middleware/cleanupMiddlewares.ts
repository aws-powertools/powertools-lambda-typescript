import {
  TRACER_KEY,
  METRICS_KEY,
  LOGGER_KEY,
  IDEMPOTENCY_KEY,
} from './constants.js';
import type { MiddyLikeRequest, CleanupFunction } from '../types/middy.js';

/**
 * Typeguard to assert that an object is of Function type.
 *
 * @param obj The object to check
 */
const isFunction = (obj: unknown): obj is CleanupFunction => {
  return typeof obj === 'function';
};

/**
 * Function used to cleanup Powertools for AWS resources when a Middy
 * middleware [returns early](https://middy.js.org/docs/intro/early-interrupt)
 * and terminates the middleware chain.
 *
 * When a middleware returns early, all the middleware lifecycle functions
 * that come after it are not executed. This means that if a middleware
 * was relying on certain logic to be run during the `after` or `onError`
 * lifecycle functions, that logic will not be executed.
 *
 * This is the case for the middlewares that are part of Powertools for AWS
 * which rely on these lifecycle functions to perform cleanup operations
 * like closing the current segment in the tracer or flushing any stored
 * metrics.
 *
 * When authoring a middleware that might return early, you can use this
 * function to cleanup Powertools resources. This function will check if
 * any cleanup function is present in the `request.internal` object and
 * execute it.
 *
 * @example
 * ```typescript
 * import middy from '@middy/core';
 * import { cleanupMiddlewares } from '@aws-lambda-powertools/commons/lib/middleware';
 *
 * // Example middleware that returns early
 * const myCustomMiddleware = (): middy.MiddlewareObj => {
 *   const before = async (request: middy.Request): Promise<undefined | string> => {
 *     // If the request is a GET, return early (as an example)
 *     if (request.event.httpMethod === 'GET') {
 *       // Cleanup Powertools resources
 *       await cleanupMiddlewares(request);
 *       // Then return early
 *       return 'GET method not supported';
 *     }
 *   };
 *
 *   return {
 *     before,
 *   };
 * };
 * ```
 *
 * @param request The Middy request object
 * @param options An optional object that can be used to pass options to the function
 */
const cleanupMiddlewares = async (request: MiddyLikeRequest): Promise<void> => {
  const cleanupFunctionNames = [
    TRACER_KEY,
    METRICS_KEY,
    LOGGER_KEY,
    IDEMPOTENCY_KEY,
  ];
  for (const functionName of cleanupFunctionNames) {
    if (Object.hasOwn(request.internal, functionName)) {
      const functionReference = request.internal[functionName];
      if (isFunction(functionReference)) {
        await functionReference(request);
      }
    }
  }
};

export { cleanupMiddlewares };
