import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'serverlessAirline' });

export const handler = async (_event, _context): Promise<void> => {
  logger.info('Hello World');
};
