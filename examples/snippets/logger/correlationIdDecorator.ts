import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { search } from '@aws-lambda-powertools/logger/correlationId';

const logger = new Logger({
  correlationIdSearchFn: search,
});

class Lambda implements LambdaInterface {
  @logger.injectLambdaContext({
    ccorrelationIdPath: 'headers.my_request_id_header',
  })
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    logger.info('This is an INFO log with some context');
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);
