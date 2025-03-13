import { Logger } from '@aws-lambda-powertools/logger';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

const logger = new Logger();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<void> => {
  logger.setCorrelationId(event.requestContext.requestId);

  logger.info('This is an INFO log with some context');
};
