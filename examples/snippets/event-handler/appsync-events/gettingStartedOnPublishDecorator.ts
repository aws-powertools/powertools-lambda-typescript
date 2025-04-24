import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { AppSyncEventsPublishEvent } from '@aws-lambda-powertools/event-handler/types';
import type { Context } from 'aws-lambda';

const app = new AppSyncEventsResolver();

class Lambda {
  @app.onPublish('/default/foo')
  async fooHandler(payload: AppSyncEventsPublishEvent) {
    return {
      processed: true,
      original_payload: payload,
    };
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context);
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
