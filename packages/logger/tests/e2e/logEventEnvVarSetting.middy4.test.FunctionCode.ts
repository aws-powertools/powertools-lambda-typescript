import type { Context } from 'aws-lambda';
import middy from 'middy4';
import { Logger } from '../../src/index.js';
import { injectLambdaContext } from '../../src/middleware/middy.js';
import type { TestEvent, TestOutput } from '../helpers/types.js';

const logger = new Logger();

const testFunction = async (
  _event: TestEvent,
  context: Context
): TestOutput => ({
  requestId: context.awsRequestId,
});

export const handler = middy(testFunction)
  // The event should be logged because POWERTOOLS_LOGGER_LOG_EVENT is set to true
  .use(injectLambdaContext(logger));
