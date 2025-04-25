import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { OnPublishAggregateOutput } from '@aws-lambda-powertools/event-handler/types';
import type { Context } from 'aws-lambda';

const app = new AppSyncEventsResolver();

app.onPublish(
  '/default/foo/*',
  async (payloads) => {
    const returnValues: OnPublishAggregateOutput<{
      processed: boolean;
      original_payload: unknown;
    }> = [];
    for (const payload of payloads) {
      try {
        returnValues.push({
          id: payload.id,
          payload: { processed: true, original_payload: payload },
        });
      } catch (error) {
        returnValues.push({
          id: payload.id,
          error: `${error.name} - ${error.message}`,
        });
      }
    }

    return returnValues;
  },
  { aggregate: true }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
