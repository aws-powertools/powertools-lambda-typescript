import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { Context } from 'aws-lambda';

const app = new AppSyncEventsResolver();

app.onPublish('/default/foo', (payload) => {
  return {
    processed: true,
    original_payload: payload,
  };
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
