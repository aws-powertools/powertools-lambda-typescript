import { Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (
  _event: unknown,
  context: Context
): Promise<void> => {
  logger.addContext(context);

  logger.info('This is an INFO log with some context');
};
