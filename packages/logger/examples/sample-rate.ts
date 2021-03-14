import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.5';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  logger.info('This is INFO log #1');
  logger.info('This is INFO log #2');
  logger.info('This is INFO log #3');
  logger.info('This is INFO log #4');

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));