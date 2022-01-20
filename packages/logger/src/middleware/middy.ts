import type { Logger } from '../Logger';
import middy from '@middy/core';

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
const injectLambdaContext = (target: Logger | Logger[]): middy.MiddlewareObj => {
  const injectLambdaContextBefore = async (request: middy.Request): Promise<void> => {
    const loggers = target instanceof Array ? target : [target];
    loggers.forEach((logger: Logger) => {
      logger.addContext(request.context);
    });
  };
  
  return {
    before: injectLambdaContextBefore,
  };
};

export {
  injectLambdaContext,
};