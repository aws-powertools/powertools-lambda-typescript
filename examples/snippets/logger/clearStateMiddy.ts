import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';

// Persistent attributes added outside the handler will be
// cached across invocations
const logger = new Logger({
  logLevel: 'DEBUG',
  persistentLogAttributes: {
    foo: 'bar',
    biz: 'baz',
  },
});

const lambdaHandler = async (
  event: { specialKey: string },
  _context: unknown
): Promise<void> => {
  // Persistent attributes added inside the handler will NOT be cached
  // across invocations
  if (event['special_key'] === '123456') {
    logger.appendKeys({
      details: { special_key: event['specialKey'] },
    });
  }
  logger.debug('This is a DEBUG log');
};

// Enable the clear state flag
export const handler = middy(lambdaHandler).use(
  injectLambdaContext(logger, { clearState: true })
);
