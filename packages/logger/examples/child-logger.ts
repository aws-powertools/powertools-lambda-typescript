import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.LOG_LEVEL = 'INFO';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const parentLogger = new Logger();

const childLogger = parentLogger.createChild({
  logLevel: 'ERROR'
});

const lambdaHandler: Handler = async () => {

  parentLogger.info('This is an INFO log, from the parent logger');
  parentLogger.error('This is an ERROR log, from the parent logger');

  childLogger.info('This is an INFO log, from the child logger');
  childLogger.error('This is an ERROR log, from the child logger');

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => {});