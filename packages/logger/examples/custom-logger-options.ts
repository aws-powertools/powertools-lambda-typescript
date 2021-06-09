// Populate runtime
require('../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.CUSTOM_ENV = 'prod';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import * as powertool from '../../../package.json';
import { CustomConfigService } from './utils/config/CustomConfigService';
import { CustomLogFormatter } from './utils/formatters/CustomLogFormatter';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger({
  logLevel: 'INFO', // Override options
  serviceName: 'foo-bar',
  sampleRateValue: 0.00001,
  persistentLogAttributes: { // Custom attributes that will be added in every log
    awsAccountId: '123456789012',
    logger: {
      name: powertool.name,
      version: powertool.version,
    }
  },
  logFormatter: new CustomLogFormatter(), // Custom log formatter to print the log in custom structure
  customConfigService: new CustomConfigService() // Custom config service, that could be used for AppConfig for example
});

const lambdaHandler: Handler = async (event, context) => {
  logger.addContext(context);

  logger.info('This is an INFO log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

  return {
    foo: 'bar'
  };
};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));