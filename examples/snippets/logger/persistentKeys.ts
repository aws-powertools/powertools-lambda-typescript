import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'serverlessAirline',
  persistentKeys: {
    environment: 'prod',
  },
});

declare const getRemoteConfig: (env: string) => { featureFlag: boolean };
const { featureFlag } = getRemoteConfig('prod');

logger.appendPersistentKeys({ featureFlag: featureFlag });

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  logger.info('processing transaction');

  // .. your business logic
};
