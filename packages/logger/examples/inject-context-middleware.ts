// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

// @ts-ignore
import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

import { injectLambdaContext } from '../src/middleware/middy';
import middy from '@middy/core';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  logger.info('This is an INFO log');

  return {
    foo: 'bar'
  };

};

const handlerWithMiddleware = middy(lambdaHandler)
  .use(injectLambdaContext(logger));

handlerWithMiddleware(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

