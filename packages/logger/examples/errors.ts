// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  try {
    throw new Error('Unexpected error #1');
  } catch (error) {
    logger.error('This is an ERROR log #1', error as Error);
  }

  try {
    throw new Error('Unexpected error #2');
  } catch (error) {
    logger.error('This is an ERROR log #2', { myCustomErrorKey: error as Error } );
  }

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));