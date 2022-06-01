import { injectLambdaContext, Logger } from '../../src';
import { APIGatewayProxyEvent, Context, APIGatewayAuthorizerResult } from 'aws-lambda';
import middy from '@middy/core';

const PERSISTENT_KEY = process.env.PERSISTENT_KEY;
const PERSISTENT_VALUE = process.env.PERSISTENT_VALUE;
const REMOVABLE_KEY = process.env.REMOVABLE_KEY;
const REMOVABLE_VALUE = process.env.REMOVABLE_VALUE;
const ERROR_MSG = process.env.ERROR_MSG || 'error';
const SINGLE_LOG_ITEM_KEY = process.env.SINGLE_LOG_ITEM_KEY;
const SINGLE_LOG_ITEM_VALUE = process.env.SINGLE_LOG_ITEM_VALUE;
const ARBITRARY_OBJECT_KEY = process.env.ARBITRARY_OBJECT_KEY;
const ARBITRARY_OBJECT_DATA = process.env.ARBITRARY_OBJECT_DATA;

const logger = new Logger({
  persistentLogAttributes: {
    [PERSISTENT_KEY]: PERSISTENT_VALUE,
    [REMOVABLE_KEY]: REMOVABLE_VALUE,
  },
});

const testFunction = async (event: APIGatewayProxyEvent, context: Context): Promise<{requestId: string}> => {
  // Test feature 1: Log level filtering
  // Test feature 2: Context data
  // Test feature 3: Add and remove persistent additional log keys and value
  // Test feature 4: X-Ray Trace ID injection
  logger.removeKeys([REMOVABLE_KEY]);
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

  // Test feature 7: Logging an arbitrary object
  const obj: APIGatewayAuthorizerResult = {
    principalId: ARBITRARY_OBJECT_DATA,
    policyDocument: {
      Version: 'Version' + ARBITRARY_OBJECT_DATA,
      Statement: [{
        Effect: 'Effect' + ARBITRARY_OBJECT_DATA,
        Action: 'Action' + ARBITRARY_OBJECT_DATA,
        Resource: 'Resource' + ARBITRARY_OBJECT_DATA
      }]
    }
  };

  logger.info('A log entry with an object', { [ARBITRARY_OBJECT_KEY]: obj });

  return {
    requestId: context.awsRequestId,
  };
};

export const handler = middy(testFunction).use(injectLambdaContext(logger));
