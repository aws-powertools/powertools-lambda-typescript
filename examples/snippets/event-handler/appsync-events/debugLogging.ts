import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'serverlessAirline',
  logLevel: 'DEBUG',
});
const app = new AppSyncEventsResolver({ logger });

app.onPublish('/default/foo', (payload) => {
  return payload;
});

export const handler = async (event: unknown, context: Context) =>
  await app.resolve(event, context);
