import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  logBufferOptions: {
    bufferAtVerbosity: 'warn', // (1)!
  },
});

export const handler = async () => {
  // All logs below are buffered
  logger.debug('This is a debug message');
  logger.info('This is an info message');
  logger.warn('This is a warn message');

  logger.clearBuffer(); // (2)!
};
