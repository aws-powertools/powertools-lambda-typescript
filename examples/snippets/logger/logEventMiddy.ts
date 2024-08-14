import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';

const logger = new Logger();

export const handler = middy(async () => {
  // ... your lambda handler
}).use(
  injectLambdaContext(logger, { logEvent: true }) // (1)
);
