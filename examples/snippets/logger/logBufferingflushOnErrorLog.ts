import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  logBufferOptions: {
    maxBytes: 20480,
    flushOnErrorLog: false, // (1)!
  },
});

export const handler = async () => {
  logger.debug('This is a debug message'); // This is buffered

  try {
    throw new Error('a non fatal error');
  } catch (error) {
    logger.error('A non fatal error occurred', { error }); // This does NOT flush the buffer
  }

  logger.debug('This is another debug message'); // This is buffered

  try {
    throw new Error('a fatal error');
  } catch (error) {
    logger.error('A fatal error occurred', { error }); // This does NOT flush the buffer
    logger.flushBuffer();
  }
};
