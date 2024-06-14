import { Logger } from '@aws-lambda-powertools/logger';

// Add persistent log keys via the constructor
const logger = new Logger({
  persistentLogAttributes: {
    aws_account_id: '123456789012',
    aws_region: 'eu-west-1',
    logger: {
      name: '@aws-lambda-powertools/logger',
      version: '0.0.1',
    },
    extra_key: 'some-value',
  },
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<unknown> => {
  // If you don't want to log the "extra_key" attribute in your logs, you can remove it
  logger.removeKeys(['extra_key']);

  // This info log will print all extra custom attributes added above
  // Extra attributes: logger object with name and version of the logger library, awsAccountId, awsRegion
  logger.info('This is an INFO log');
  logger.info('This is another INFO log');

  return {
    foo: 'bar',
  };
};
