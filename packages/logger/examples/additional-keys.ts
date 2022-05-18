// Populate runtime
require('../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async (event) => {

  // Pass a custom correlation ID
  logger.warn('This is a WARN log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

  // Pass an error that occurred
  logger.error('This is an ERROR log', new Error('Something bad happened!'));

  // Pass a simple string as additional data
  logger.info('This is an INFO log', 'Extra log data');

  // Pass an arbitrary object as additional data
  logger.debug('This is a DEBUG log', { lambdaEvent: event });

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));