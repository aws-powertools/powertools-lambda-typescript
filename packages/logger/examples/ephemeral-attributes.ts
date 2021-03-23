import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  // Example of use case:
  // Log an error with a message (informative string) and
  // some extra ephemeral custom attributes to help debugging (like a correlation ID)

  // Logs below will result in the same JSON output

  const error = new Error('Something bad happened!');

  // You can add ephemeral extra custom attributes like this:
  logger.error('This is an ERROR log', error, { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

  // Or you can also add them like this (same log output):
  logger.error({ message: 'This is an ERROR log', correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } }, error);

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));