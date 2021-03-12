import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.POWERTOOLS_CONTEXT_ENABLED = 'TRUE';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async (event, context) => {
  logger.addContext(context);

  logger.debug('This is a DEBUG log', { bar: 'baz' });
  logger.info('This is an INFO log', { bar: 'baz' });
  logger.warn('This is a WARN log', { bar: 'baz' });
  logger.error('This is an ERROR log', { bar: 'baz' });

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));