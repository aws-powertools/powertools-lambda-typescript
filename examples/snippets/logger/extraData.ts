import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (
  event: unknown,
  _context: unknown
): Promise<unknown> => {
  const myImportantVariable = {
    foo: 'bar',
  };

  // Log additional data in single log items

  // As second parameter
  logger.info('This is a log with an extra variable', {
    data: myImportantVariable,
  });

  // You can also pass multiple parameters containing arbitrary objects
  logger.info(
    'This is a log with 3 extra objects',
    { data: myImportantVariable },
    { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } },
    { lambdaEvent: event }
  );

  // Simply pass a string for logging additional data
  logger.info('This is a log with additional string value', 'string value');

  // Directly passing an object containing both the message and the additional info
  const logObject = {
    message: 'This is a log message',
    additionalValue: 42,
  };

  logger.info(logObject);

  return {
    foo: 'bar',
  };
};
