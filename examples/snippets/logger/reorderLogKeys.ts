import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'serverlessAirline',
  logRecordOrder: ['timestamp', 'additionalKey'],
});

export const handler = async (): Promise<void> => {
  logger.info('Hello, World!', {
    additionalKey: 'additionalValue',
  });
};
