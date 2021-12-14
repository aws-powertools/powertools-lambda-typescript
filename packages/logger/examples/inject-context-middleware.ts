// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import { Handler } from 'aws-lambda';
import { Logger } from '../src';
import { injectLambdaContext } from '../src/middleware/middy';
import middy from '@middy/core';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  logger.debug('This is a DEBUG log');
  logger.info('This is an INFO log');
  logger.warn('This is a WARN log');
  logger.error('This is an ERROR log');

  return {
    foo: 'bar'
  };

};

const lambdaHandlerWithMiddleware = middy(lambdaHandler)
  .use(injectLambdaContext(logger));

