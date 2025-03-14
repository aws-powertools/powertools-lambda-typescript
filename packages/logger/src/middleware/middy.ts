import { LOGGER_KEY } from '@aws-lambda-powertools/commons';
import type {
  JSONObject,
  MiddlewareLikeObj,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import { Logger } from '../Logger.js';
import { UncaughtErrorLogMessage } from '../constants.js';
import type { InjectLambdaContextOptions } from '../types/Logger.js';

/**
 * A Middy.js-compatible middleware to enrich your logs with AWS Lambda context information.
 *
 * Using this middleware on your handler function will automatically adds context information to logs,
 * as well as optionally log the event and clear attributes set during the invocation.
 *
 * @example
 * ```typescript
 * import { Logger } from '@aws-lambda-powertools/logger';
 * import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
 * import middy from '@middy/core';
 *
 * const logger = new Logger({ serviceName: 'serverlessAirline' });
 *
 * export const handler = middy(() => {
 *   logger.info('This is an INFO log with some context');
 * }).use(injectLambdaContext(logger));
 * ```
 *
 * **Logging the event payload**
 *
 * When debugging, you might want to log the event payload to understand the input to your Lambda function.
 * You can enable this by setting the `logEvent` option to `true` when creating the Logger instance.
 *
 * @example
 * ```typescript
 * const logger = new Logger({ serviceName: 'serverlessAirline' });
 *
 * export const handler = middy(() => {
 *   logger.info('This is an INFO log with some context');
 * }).use(injectLambdaContext(logger, {
 *   logEvent: true,
 * }));
 * ```
 *
 * **Resetting state**
 *
 * To avoid leaking sensitive information across invocations, you can reset the keys added via
 * {@link Logger.appendKeys()} by setting the `resetKeys` option to `true`.
 *
 * @example
 * ```typescript
 * const logger = new Logger({ serviceName: 'serverlessAirline' });
 *
 * export const handler = middy(() => {
 *   logger.appendKeys({ key1: 'value1' });
 *   logger.info('This is an INFO log with some context');
 * }).use(injectLambdaContext(logger, {
 *   resetKeys: true,
 * }));
 *
 * @param target - The Logger instance(s) to use for logging
 * @param options - Options for the middleware such as clearing state or resetting keys
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
      [LOGGER_KEY]: after,
    };
  };

  const before = async (request: MiddyLikeRequest): Promise<void> => {
    for (const logger of loggers) {
      if (isResetStateEnabled) {
        setCleanupFunction(request);
      }

      logger.refreshSampleRateCalculation();

      Logger.injectLambdaContextBefore(
        logger,
        request.event,
        request.context,
        options
      );

      if (options?.correlationIdPath) {
        logger.setCorrelationIdFromPath(
          options.correlationIdPath,
          request.event as JSONObject
        );
      }
    }
  };

  const after = async (): Promise<void> => {
    for (const logger of loggers) {
      logger.clearBuffer();

      if (isResetStateEnabled) {
        logger.resetKeys();
      }
    }
  };

  const onError = async ({ error }: { error: unknown }): Promise<void> => {
    for (const logger of loggers) {
      if (options?.flushBufferOnUncaughtError) {
        logger.flushBuffer();
        logger.error({
          message: UncaughtErrorLogMessage,
          error,
        });
      } else {
        logger.clearBuffer();
      }
    }
  };

  return {
    before,
    after,
    onError,
  };
};

export { injectLambdaContext };
