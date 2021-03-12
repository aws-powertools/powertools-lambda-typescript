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

const lambdaHandler: Handler = async (event, context) => {
  parentLogger.addContext(context);

  parentLogger.debug('This is a DEBUG log, from the parent logger', { logger: 'parent' });
  parentLogger.info('This is an INFO log, from the parent logger', { logger: 'parent' });
  parentLogger.warn('This is a WARN log, from the parent logger', { logger: 'parent' });
  parentLogger.error('This is an ERROR log, from the parent logger', { logger: 'parent' });

  const childLogger = parentLogger.createChild({
    logLevel: 'ERROR'
  });

  childLogger.debug('This is a DEBUG log, from the child logger', { logger: 'child' });
  childLogger.info('This is an INFO log, from the child logger', { logger: 'child' });
  childLogger.warn('This is a WARN log, from the child logger', { logger: 'child' });
  childLogger.error('This is an ERROR log, from the child logger', { logger: 'child' });

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => {});