import { Logger } from '@aws-lambda-powertools/logger';

// This logger has a service name, some persistent attributes
// and log level set to INFO
const logger = new Logger({
  serviceName: 'serverlessAirline',
  logLevel: 'INFO',
  persistentLogAttributes: {
    aws_account_id: '123456789012',
    aws_region: 'eu-west-1',
  },
});

// This other logger inherits all the parent's attributes
// but the log level, which is now set to ERROR
const childLogger = logger.createChild({
  logLevel: 'ERROR',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  logger.info('This is an INFO log, from the parent logger');
  logger.error('This is an ERROR log, from the parent logger');

  childLogger.info('This is an INFO log, from the child logger');
  childLogger.error('This is an ERROR log, from the child logger');
};
