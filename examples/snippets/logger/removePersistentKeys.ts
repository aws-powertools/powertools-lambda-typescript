import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'serverlessAirline',
  persistentKeys: {
    foo: true,
  },
});

declare const getRemoteConfig: (env: string) => {
  isFoo: boolean;
};

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  const { isFoo } = getRemoteConfig('prod');
  if (isFoo) logger.removePersistentKeys(['foo']);

  logger.info('processing transaction');

  // ... your business logic
};
