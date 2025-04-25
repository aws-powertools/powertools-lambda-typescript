import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { AppSyncEventsSubscribeEvent } from '@aws-lambda-powertools/event-handler/types';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import type { Context } from 'aws-lambda';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'chat',
  singleMetric: true,
});
const app = new AppSyncEventsResolver();

class Lambda {
  @app.onSubscribe('/default/foo')
  async fooHandler(event: AppSyncEventsSubscribeEvent) {
    metrics.addDimension('channel', event.info.channel.path);
    metrics.addMetric('connections', MetricUnit.Count, 1);
  }

  async handler(event: unknown, context: Context) {
    return app.resolve(event, context);
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);
