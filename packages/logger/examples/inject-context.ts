// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';
import { context, context as dummyContext } from '../../../tests/resources/contexts/hello-world';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  logger.addContext(context);

  logger.info('This is an INFO log');

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));