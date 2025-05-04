import { AppSyncEventsResolver } from '@aws-lambda-powertools/event-handler/appsync-events';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import type { Context } from 'aws-lambda';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'chat',
  singleMetric: true,
});
const app = new AppSyncEventsResolver();

app.onSubscribe('/default/foo', (event) => {
  metrics.addDimension('channel', event.info.channel.path);
  metrics.addMetric('connections', MetricUnit.Count, 1);
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
