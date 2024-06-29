import { Logger } from '@aws-lambda-powertools/logger';

export const handler = async (_event, _context): Promise<void> => {
  const loggerInUTC = new Logger({ serviceName: 'payment' });
  loggerInUTC.info('Logging with default AWS Lambda timezone: UTC time');

  process.env.TZ = 'US/Eastern'; // (1)!

  const logger = new Logger({ serviceName: 'order' });
  logger.info('Logging with US Eastern timezone');
};
