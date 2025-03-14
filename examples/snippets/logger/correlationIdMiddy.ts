import { Logger } from '@aws-lambda-powertools/logger';
import { search } from '@aws-lambda-powertools/logger/correlationId';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';

const logger = new Logger({
  correlationIdSearchFn: search,
});

export const handler = middy()
  .use(
    injectLambdaContext(logger, {
      correlationIdPath: 'headers.my_request_id_header',
    })
  )
  .handler(async () => {
    logger.info('log with correlation_id');
  });
