import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'serverlessAirline' });

export const handler = async () => {
  logger.info('Hello World');
};
