// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.LOG_LEVEL = 'ERROR';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.5';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  // This log item (equal to log level 'ERROR') will be printed to standard output
  // in all Lambda invocations
  logger.error('This is an ERROR log');

  // These log items (below the log level 'ERROR') have ~50% chance
  // of being printed in a Lambda invocation
  logger.debug('This is a DEBUG log that has 50% chance of being printed');
  logger.info('This is an INFO log that has 50% chance of being printed');
  logger.warn('This is a WARN log that has 50% chance of being printed');

  // Optional: refresh sample rate calculation on runtime
  // logger.refreshSampleRateCalculation();

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('lambda invoked!'));