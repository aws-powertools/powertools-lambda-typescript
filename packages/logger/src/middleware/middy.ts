import type { Logger } from '../Logger';
import middy from '@middy/core';

/**
 * Middy middleware that adds the current Lambda invocation's context
 * inside all log items.
 *
 * @param {Logger|Logger[]} target
 * @returns middy.MiddlewareObj
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