// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import * as powertool from '../../../package.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  // Add persistent log keys to an existing Logger instance:
  logger.appendKeys({
    aws_account_id: '123456789012',
    aws_region: 'eu-central-1',
    logger: {
      name: powertool.name,
      version: powertool.version,
    }
  });

  // This info log will print all extra custom attributes added above
  // Extra attributes: logger object with name and version of this library, awsAccountId, awsRegion
  logger.info('This is an INFO log');
  logger.info('This is another INFO log');

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));