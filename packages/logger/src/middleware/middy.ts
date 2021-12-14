import type { Logger } from '../Logger';
import middy from '@middy/core';

const injectLambdaContext = (target: Logger | Logger[]): middy.MiddlewareObj => {
  const injectLambdaContextBefore = async (request: middy.Request): Promise<void> => {
    const loggers = target instanceof Array ? target : [ target ];
    loggers.forEach((logger: Logger) => {
      logger.addContext(request.context);
      console.log('foo', logger);
    })
  };
  return {
    before: injectLambdaContextBefore,
  };
};

export {
  injectLambdaContext,
};