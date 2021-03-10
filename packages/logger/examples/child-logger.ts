process.env._X_AMZN_TRACE_ID = 'abcdef123456abcdef123456abcdef123456';
process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-lambda-function';
process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '128';
process.env.AWS_REGION = 'eu-central-1';
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

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