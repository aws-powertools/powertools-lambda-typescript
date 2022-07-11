import { injectLambdaContext, Logger } from '../../src';
import { Context } from 'aws-lambda';
import middy from '@middy/core';

type LambdaEvent = {
  invocation: number
};

const logger = new Logger();

const testFunction = async (event: LambdaEvent, context: Context): Promise<{requestId: string}> => ({
  requestId: context.awsRequestId,
});

export const handler = middy(testFunction)
  .use(injectLambdaContext(logger));
