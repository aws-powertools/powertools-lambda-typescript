import { Logger } from '../../src/index.js';
import { injectLambdaContext } from '../../src/middleware/middy.js';
import type { Context, APIGatewayAuthorizerResult } from 'aws-lambda';
import type { TestEvent, TestOutput } from '../helpers/types.js';
import middy from 'middy5';

const PERSISTENT_KEY = process.env.PERSISTENT_KEY || 'persistentKey';
const PERSISTENT_VALUE = process.env.PERSISTENT_VALUE || 'persistentValue';
const REMOVABLE_KEY = process.env.REMOVABLE_KEY || 'removableKey';
const REMOVABLE_VALUE = process.env.REMOVABLE_VALUE || 'remvovableValue';
const ERROR_MSG = process.env.ERROR_MSG || 'error';
const RUNTIME_ADDED_KEY = process.env.RUNTIME_ADDED_KEY || 'runtimeAddedKey';
const SINGLE_LOG_ITEM_KEY =
  process.env.SINGLE_LOG_ITEM_KEY || 'keyForSingleLogItem';
const SINGLE_LOG_ITEM_VALUE =
  process.env.SINGLE_LOG_ITEM_VALUE || 'valueForSingleLogItem';
const ARBITRARY_OBJECT_KEY =
  process.env.ARBITRARY_OBJECT_KEY || 'keyForArbitraryObject';
const ARBITRARY_OBJECT_DATA =
  process.env.ARBITRARY_OBJECT_DATA || 'arbitrary object data';

const logger = new Logger({
  persistentLogAttributes: {
    [PERSISTENT_KEY]: PERSISTENT_VALUE, // This key-value pair will be added to every log
    [REMOVABLE_KEY]: REMOVABLE_VALUE, // This other one will be removed at runtime and not displayed in any log
  },
});

const testFunction = async (event: TestEvent, context: Context): TestOutput => {
  // Test feature 1: Context data injection (all logs should have the same context data)
  // Test feature 2: Event log (this log should have the event data)
  // Test feature 3: Log level filtering (log level is set to INFO)
  logger.debug('##### This should not appear');

  // Test feature 4: Add and remove persistent additional log keys and value
  logger.removeKeys([REMOVABLE_KEY]); // This key should not appear in any log (except the event log)
  logger.appendKeys({
    // This key-value pair should appear in every log (except the event log)
    [RUNTIME_ADDED_KEY]: 'bar',
  });

  // Test feature 5: One-time additional log keys and values
  logger.info('This is an one-time log with an additional key-value', {
    [SINGLE_LOG_ITEM_KEY]: SINGLE_LOG_ITEM_VALUE,
  });

  // Test feature 6: Error logging
  try {
    throw new Error(ERROR_MSG);
  } catch (e) {
    logger.error(ERROR_MSG, e as Error);
  }

  // Test feature 7: Arbitrary object logging
  const obj: APIGatewayAuthorizerResult = {
    principalId: ARBITRARY_OBJECT_DATA,
    policyDocument: {
      Version: 'Version 1',
      Statement: [
        {
          Effect: 'Allow',
          Action: 'geo:*',
          Resource: '*',
        },
      ],
    },
  };
  logger.info('A log entry with an object', { [ARBITRARY_OBJECT_KEY]: obj });

  // Test feature 8: X-Ray Trace ID injection (all logs should have the same X-Ray Trace ID)

  return {
    requestId: context.awsRequestId,
  };
};

export const handler = middy(testFunction).use(
  injectLambdaContext(logger, { clearState: true, logEvent: true })
);
