import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  logBufferOptions: {
    maxBytes: 20480,
    flushOnErrorLog: true,
  },
});

logger.debug('This is a debug message'); // This is NOT buffered

export const handler = async () => {
  logger.debug('This is a debug message'); // This is buffered
  logger.info('This is an info message');

  // your business logic here

  logger.error('This is an error message'); // This also flushes the buffer
  // or logger.flushBuffer(); // to flush the buffer manually
};
