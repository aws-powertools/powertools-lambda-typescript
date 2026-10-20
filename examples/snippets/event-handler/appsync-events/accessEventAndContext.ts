import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'serverlessAirline',
});
const app = new AppSyncEventsResolver();

app.onPublish('/*', (payload, event, context) => {
  const { headers } = event.request; // (1)!
  const { awsRequestId } = context;
  logger.info('headers', { headers, awsRequestId });

  // your business logic here

  return payload;
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
