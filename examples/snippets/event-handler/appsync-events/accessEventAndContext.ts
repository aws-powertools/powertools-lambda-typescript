import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { Context } from 'aws-lambda';

const app = new AppSyncEventsResolver();

app.onPublish('/*', (payload, event, context) => {
  const { headers } = event.request; // (1)!
  const { awsRequestId } = context;

  // your business logic here

  return payload;
});

export const handler = async (event: unknown, context: Context) =>
  await app.resolve(event, context);
