import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { Context } from 'aws-lambda';

const app = new AppSyncEventsResolver();

app.onPublish('/default/*', (_payload) => {
  // your logic here
});

app.onSubscribe('/*', (_payload) => {
  // your logic here
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
