import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (event: { orderId: string }) => {
  const singleMetric = metrics.singleMetric();
  singleMetric.addDimension('metricType', 'business');
  singleMetric.addMetadata('orderId', event.orderId); // (1)!
  singleMetric.addMetric('successfulBooking', MetricUnit.Count, 1); // (2)!
};
