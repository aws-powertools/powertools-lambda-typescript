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
  logLevel: 'WARN',
  serviceName: 'foo-bar',
  sampleRateValue: 0.00001,
  logFormatter: new CustomLogFormatter(),
  customConfigService: new CustomConfigService(), // This could be used for AppConfig
  customAttributes: {
    awsAccountId: '123456789012',
    logger: {
      name: powertool.name,
      version: powertool.version,
    }
  }
});

const lambdaHandler: Handler = async (event, context) => {
  logger.addContext(context);

  logger.debug('This is a DEBUG log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });
  logger.info('This is an INFO log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });
  logger.warn('This is a WARN log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });
  logger.error('This is an ERROR log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));