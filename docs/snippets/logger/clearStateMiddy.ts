import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
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
  event: { special_key: string },
  _context: unknown
): Promise<void> => {
  // Persistent attributes added inside the handler will NOT be cached
  // across invocations
  if (event['special_key'] === '123456') {
    logger.appendKeys({
      details: { special_key: event['special_key'] },
    });
  }
  logger.debug('This is a DEBUG log');
};

// Enable the clear state flag
export const handler = middy(lambdaHandler).use(
  injectLambdaContext(logger, { clearState: true })
);
