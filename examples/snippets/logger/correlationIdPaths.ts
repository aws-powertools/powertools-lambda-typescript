import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { search } from '@aws-lambda-powertools/jmespath';
import { Logger, correlationPaths } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  correlationIdSearchFn: search,
});

class Lambda implements LambdaInterface {
  @logger.injectLambdaContext({
    ccorrelationIdPath: correlationPaths.API_GATEWAY_REST,
  })
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    logger.info('This is an INFO log with some context');
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
