import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';

const logger = new Logger({
  logLevel: 'DEBUG',
  logBufferOptions: { enabled: true },
});

export const handler = middy()
  .use(injectLambdaContext(logger, { flushBufferOnUncaughtError: true }))
  .handler(async (event: unknown) => {
    // Both logs below are buffered
    logger.debug('a debug log');
    logger.debug('another debug log');

    throw new Error('an error log'); // This causes the buffer to flush
  });
