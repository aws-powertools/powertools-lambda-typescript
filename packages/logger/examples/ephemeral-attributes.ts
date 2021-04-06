import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  const myImportantVariable = {
    foo: 'bar'
  };

  // Pass a variable
  logger.info('This is a log with an extra variable', { data: { myImportantVariable } });

  // Pass a variable
  const myOtherImportantVariable = {
    biz: 'baz'
  };

  // Pass multiple variables
  logger.info('This is a log with 2 extra variables', {
    data: { myOtherImportantVariable },
    correlationIds: { myCustomCorrelationId: 'foo-bar-baz' }
  });

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));