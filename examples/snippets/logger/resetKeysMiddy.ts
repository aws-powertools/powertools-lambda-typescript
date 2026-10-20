import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';

// Persistent attributes will be cached across invocations
const logger = new Logger({
  logLevel: 'info',
  persistentKeys: {
    environment: 'prod',
  },
});

export const handler = middy(
  async (event: { userId: string }, _context: unknown): Promise<void> => {
    // This temporary key will be included in the log & cleared after the invocation
    logger.appendKeys({
      details: { userId: event.userId },
    });

    // ... your business logic

    logger.info('WIDE');
  }
).use(injectLambdaContext(logger, { resetKeys: true }));
