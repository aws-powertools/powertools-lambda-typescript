import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  logLevel: 'DEBUG',
  logBufferOptions: { enabled: true },
});

class Lambda {
  @logger.injectLambdaContext({
    flushBufferOnUncaughtError: true,
  })
  async handler(_event: unknown, _context: Context) {
    // Both logs below are buffered
    logger.debug('a debug log');
    logger.debug('another debug log');

    throw new Error('an error log'); // This causes the buffer to flush
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
