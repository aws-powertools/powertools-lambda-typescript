import { Logger } from '@aws-lambda-powertools/logger';

// Persistent attributes will be cached across invocations
const logger = new Logger({
  logLevel: 'info',
  persistentKeys: {
    environment: 'prod',
  },
});

// Enable the clear state flag
export const handler = async (
  event: { userId: string },
  _context: unknown
): Promise<void> => {
  try {
    // This temporary key will be included in the log & cleared after the invocation
    logger.appendKeys({
      details: { userId: event.userId },
    });

    // ... your business logic
  } finally {
    logger.info('WIDE');
    logger.resetState();
  }
};
