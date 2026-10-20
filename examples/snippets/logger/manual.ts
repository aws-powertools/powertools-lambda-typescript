import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();

export const handler = async (
  _event: unknown,
  context: Context
): Promise<void> => {
  logger.addContext(context);

  logger.info('This is an INFO log with some context');
};
