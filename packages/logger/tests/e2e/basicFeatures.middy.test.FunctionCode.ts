import { injectLambdaContext, Logger } from '../../src';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import middy from '@middy/core';

const PERSISTENT_KEY = process.env.PERSISTENT_KEY;
const PERSISTENT_VALUE = process.env.PERSISTENT_VALUE;
const ERROR_MSG = process.env.ERROR_MSG || 'error';
const SINGLE_LOG_ITEM_KEY = process.env.SINGLE_LOG_ITEM_KEY;
const SINGLE_LOG_ITEM_VALUE = process.env.SINGLE_LOG_ITEM_VALUE;

const logger = new Logger({
  persistentLogAttributes: {
    [PERSISTENT_KEY]: PERSISTENT_VALUE,
  },
});

const testFunction = async (event: APIGatewayProxyEvent, context: Context): Promise<{requestId: string}> => {
  // Test feature 1: Log level filtering
  // Test feature 2: Context data
  // Test feature 3: Persistent additional log keys and value
  // Test feature 4: X-Ray Trace ID injection
  logger.debug('##### This should not appear');
  logger.info('This is an INFO log with context and persistent key');

  // Test feature 5: One-time additional log keys and values
  logger.info('This is an one-time log with an additional key-value', {
    [SINGLE_LOG_ITEM_KEY]: SINGLE_LOG_ITEM_VALUE,
  });

  // Test feature 6: Logging an error object
  try {
    throw new Error(ERROR_MSG);
  } catch (e) {
    logger.error(ERROR_MSG, e as Error);
  }

  return {
    requestId: context.awsRequestId,
  };
};

export const handler = middy(testFunction).use(injectLambdaContext(logger));
