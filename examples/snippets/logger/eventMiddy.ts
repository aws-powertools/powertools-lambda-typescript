import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';

const logger = new Logger();

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  logger.info('This is an INFO log with some context');
};

export const handler = middy(lambdaHandler).use(
  injectLambdaContext(logger, { logEvent: true })
);
