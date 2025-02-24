import { Logger } from '@aws-lambda-powertools/logger';

// Notice the log level set to 'ERROR'
const logger = new Logger({
  logLevel: 'ERROR',
  sampleRateValue: 0.5,
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  // Refresh sample rate calculation on runtime, only when not using injectLambdaContext
  logger.refreshSampleRateCalculation();
  // This log item (equal to log level 'ERROR') will be printed to standard output
  // in all Lambda invocations
  logger.error('This is an ERROR log');

  // These log items (below the log level 'ERROR') have ~50% chance
  // of being printed in a Lambda invocation
  logger.debug('This is a DEBUG log that has 50% chance of being printed');
  logger.info('This is an INFO log that has 50% chance of being printed');
  logger.warn('This is a WARN log that has 50% chance of being printed');

  // Optional: refresh sample rate calculation on runtime
  // logger.refreshSampleRateCalculation();
};
