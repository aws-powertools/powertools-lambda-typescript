import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { AppSyncEventsPublishEvent } from '@aws-lambda-powertools/event-handler/types';
import type { Context } from 'aws-lambda';

const app = new AppSyncEventsResolver();

app.onPublish(
  '/default/foo/*',
  async (events) => {
    const payloadsToReturn: AppSyncEventsPublishEvent['events'] = [];

    for (const event of events) {
      if (event.payload.includes('foo')) continue;
      payloadsToReturn.push(event);
    }

    return payloadsToReturn; // (1)!
  },
  { aggregate: true }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
