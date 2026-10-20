import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'appsync-events',
  logLevel: 'DEBUG',
});
const app = new AppSyncEventsResolver();

app.onPublish('/default/foo', (payload) => {
  try {
    return payload;
  } catch (error) {
    logger.error('Error processing event', { error });
    throw error;
  }
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
