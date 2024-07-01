import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'serverlessAirline',
});

const processTransaction = async (customerId: string): Promise<void> => {
  try {
    logger.appendKeys({
      customerId,
    });

    // ... your business logic

    logger.info('transaction processed');
  } finally {
    logger.removeKeys(['customerId']);
  }
};

export const handler = async (
  event: { customerId: string },
  _context: unknown
): Promise<void> => {
  await processTransaction(event.customerId);

  // .. other business logic

  logger.info('other business logic processed');
};
