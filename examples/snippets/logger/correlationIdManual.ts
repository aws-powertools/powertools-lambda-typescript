import { Logger } from '@aws-lambda-powertools/logger';
import type { APIGatewayProxyEvent } from 'aws-lambda';

const logger = new Logger();

export const handler = async (event: APIGatewayProxyEvent) => {
  logger.setCorrelationId(event.requestContext.requestId); // (1)!

  logger.info('log with correlation_id');
};
