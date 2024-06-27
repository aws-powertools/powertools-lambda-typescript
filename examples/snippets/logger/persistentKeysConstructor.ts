import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'serverlessAirline',
  persistentKeys: {
    environment: 'prod',
    version: process.env.BUILD_VERSION,
  },
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  logger.info('processing transaction');

  // ... your business logic
};
