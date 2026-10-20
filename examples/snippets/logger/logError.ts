import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  try {
    throw new Error('Unexpected error #1');
  } catch (error) {
    // Log information about the error using the default "error" key
    logger.error('This is the first error', error as Error);
  }

  try {
    throw new Error('Unexpected error #2');
  } catch (error) {
    // Log information about the error using a custom "myCustomErrorKey" key
    logger.error('This is the second error', {
      myCustomErrorKey: error as Error,
    });
  }
};
