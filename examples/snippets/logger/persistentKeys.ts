import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'serverlessAirline',
});

declare const getRemoteConfig: (env: string) => {
  environment: string;
  version: string;
};
const { environment, version } = getRemoteConfig('prod');

logger.appendPersistentKeys({ environment, version });

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  logger.info('processing transaction');

  // .. your business logic
};
