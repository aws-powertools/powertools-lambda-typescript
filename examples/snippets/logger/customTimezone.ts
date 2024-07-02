import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'serverlessAirline' });

export const handler = async (): Promise<void> => {
  logger.info('Hello, World!');

  process.env.TZ = 'Europe/Rome';

  const childLogger = logger.createChild();

  childLogger.info('Ciao, Mondo!');
};
