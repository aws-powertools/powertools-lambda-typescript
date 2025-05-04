import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { OnPublishAggregateOutput } from '@aws-lambda-powertools/event-handler/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'serverlessAirline',
  logLevel: 'INFO',
});
const app = new AppSyncEventsResolver();

app.onPublish(
  '/default/foo/*',
  async (payloads) => {
    const returnValues: OnPublishAggregateOutput<{
      processed: boolean;
      original_payload: unknown;
    }> = [];
    try {
      for (const payload of payloads) {
        returnValues.push({
          id: payload.id,
          payload: { processed: true, original_payload: payload },
        });
      }
    } catch (error) {
      logger.error('Error processing payloads', { error });
      throw error;
    }

    return returnValues;
  },
  { aggregate: true }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
