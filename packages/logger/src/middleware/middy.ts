import type { Logger } from '../Logger';
import type middy from '@middy/core';
import { HandlerOptions, LogAttributes } from '../types';

/**
 * A middy middleware that adds the current Lambda invocation's context inside all log items.
 *
 * ## Usage
 *
 * @example
 * ```typescript
 * import { Logger, injectLambdaContext } from "@aws-lambda-powertools/logger";
 *
 * import middy from '@middy/core';
 *
 *
 * const logger = new Logger();
 *
 * const lambdaHandler = async (_event: any, _context: any) => {
 *     logger.info("This is an INFO log with some context");
 * };
 *
 *
 * export const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
 * ```
 *
 * @param {Logger|Logger[]} target - The Tracer instance to use for tracing
 * @returns {middy.MiddlewareObj} - The middy middleware object
 */
const injectLambdaContext = (target: Logger | Logger[], options?: HandlerOptions): middy.MiddlewareObj => {

  const loggers = target instanceof Array ? target : [target];
  const persistentAttributes: LogAttributes[] = [];

  const injectLambdaContextBefore = async (request: middy.Request): Promise<void> => {
    loggers.forEach((logger: Logger) => {
      logger.addContext(request.context);
      if (options && options.clearState === true) {
        persistentAttributes.push({ ...logger.getPersistentLogAttributes() });
      }

      let shouldLogEvent = undefined;
      if ( options && options.hasOwnProperty('logEvent') ) {
        shouldLogEvent = options.logEvent;
      }
      logger.logEventIfEnabled(request.event, shouldLogEvent);
    });
  };

  const injectLambdaContextAfter = async (): Promise<void> => {
    if (options && options.clearState === true) {
      loggers.forEach((logger: Logger, index: number) => {
        logger.setPersistentLogAttributes(persistentAttributes[index]);
      });
    }
  };

  return {
    before: injectLambdaContextBefore,
    after: injectLambdaContextAfter
  };
};

export {
  injectLambdaContext,
};