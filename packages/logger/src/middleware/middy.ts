import { LOGGER_KEY } from '@aws-lambda-powertools/commons';
import type {
  MiddlewareLikeObj,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import { Logger } from '../Logger.js';
import type { InjectLambdaContextOptions } from '../types/Logger.js';

/**
 * A middy middleware that helps emitting CloudWatch EMF metrics in your logs.
 *
 * Using this middleware on your handler function will automatically add context information to logs, as well as optionally log the event and clear attributes set during the invocation.
 *
 * @example
 * ```typescript
 * import { Logger } from '@aws-lambda-powertools/logger';
 * import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
 * import middy from '@middy/core';
 *
 *
 * const logger = new Logger();
 *
 * const lambdaHandler = async (_event: any, _context: any) => {
 *     logger.info('This is an INFO log with some context');
 * };
 *
 * export const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
 * ```
 *
 * @param target - The Logger instance(s) to use for logging
 * @param options - (_optional_) Options for the middleware
 * @returns - The middy middleware object
 */
const injectLambdaContext = (
  target: Logger | Logger[],
  options?: InjectLambdaContextOptions
): MiddlewareLikeObj => {
  const loggers = Array.isArray(target) ? target : [target];
  const isResetStateEnabled =
    options && (options.clearState || options.resetKeys);

  /**
   * Set the cleanup function to be called in case other middlewares return early.
   *
   * @param request - The request object
   */
  const setCleanupFunction = (request: MiddyLikeRequest): void => {
    request.internal = {
      ...request.internal,
      [LOGGER_KEY]: injectLambdaContextAfterOrOnError,
    };
  };

  const injectLambdaContextBefore = async (
    request: MiddyLikeRequest
  ): Promise<void> => {
    for (const logger of loggers) {
      if (isResetStateEnabled) {
        setCleanupFunction(request);
      }
      Logger.injectLambdaContextBefore(
        logger,
        request.event,
        request.context,
        options
      );
    }
  };

  const injectLambdaContextAfterOrOnError = async (): Promise<void> => {
    if (isResetStateEnabled) {
      for (const logger of loggers) {
        logger.resetKeys();
      }
    }
  };

  return {
    before: injectLambdaContextBefore,
    after: injectLambdaContextAfterOrOnError,
    onError: injectLambdaContextAfterOrOnError,
  };
};

export { injectLambdaContext };
