import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  logLevel: 'ERROR', // (1)!
  sampleRateValue: 0.5,
});

export const handler = async () => {
  logger.refreshSampleRateCalculation(); // (2)!

  logger.error('This log is always emitted');

  logger.debug('This log has ~50% chance of being emitted');
  logger.info('This log has ~50% chance of being emitted');
  logger.warn('This log has ~50% chance of being emitted');
};
