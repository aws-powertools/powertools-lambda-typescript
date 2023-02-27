import { injectLambdaContext, Logger } from '../../src';
import { TestEvent, TestOutput } from '../helpers/types';
import { Context } from 'aws-lambda';
import middy from '@middy/core';

const logger = new Logger();

const testFunction = async (_event: TestEvent, context: Context): TestOutput => ({
  requestId: context.awsRequestId,
});

export const handler = middy(testFunction)
  // The event should be logged because POWERTOOLS_LOGGER_LOG_EVENT is set to true
  .use(injectLambdaContext(logger)); 
