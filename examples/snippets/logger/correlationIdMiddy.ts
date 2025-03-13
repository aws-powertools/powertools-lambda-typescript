import { Logger } from '@aws-lambda-powertools/logger';
import { search } from '@aws-lambda-powertools/logger/correlationId';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';

const logger = new Logger({
  correlationIdSearchFn: search,
});

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  logger.info('This is an INFO log with some context');
};

export const handler = middy(lambdaHandler).use(
  injectLambdaContext(logger, {
    correlationIdPath: 'headers.my_request_id_header',
  })
);
