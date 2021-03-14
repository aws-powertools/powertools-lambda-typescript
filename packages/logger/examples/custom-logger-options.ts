import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.CUSTOM_ENV = 'prod';
process.env.POWERTOOLS_CONTEXT_ENABLED = 'TRUE';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import * as powertool from '../../../package.json';
import { CustomConfigService } from './config/CustomConfigService';
import { CustomLogFormatter } from './formatters/CustomLogFormatter';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Logger } from '../src';

const logger = new Logger({
  logLevel: 'INFO', // Override options
  serviceName: 'foo-bar',
  sampleRateValue: 0.00001,
  customAttributes: { // Custom attributes that will be added in every log
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