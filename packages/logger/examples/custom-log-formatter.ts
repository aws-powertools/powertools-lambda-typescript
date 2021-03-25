import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import * as powertool from '../../../package.json';
import { MyCompanyLogFormatter } from './formatters/MyCompanyLogFormatter';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger({
  logFormatter: new MyCompanyLogFormatter(), // Custom log formatter to print the log in a custom structure
  logLevel: 'DEBUG',
  serviceName: 'hello-world',
  sampleRateValue: 0.5,
  persistentLogAttributes: { // Custom attributes that will be added in every log item
    awsAccountId: process.env.AWS_ACCOUNT_ID || '123456789012',
    logger: {
      name: powertool.name,
      version: powertool.version,
    }
  },
});

const lambdaHandler: Handler = async (event, context) => {
  logger.addContext(context);

  logger.info('This is an INFO log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

  return {
    foo: 'bar'
  };
};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));