import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addDimension('metricUnit', 'milliseconds');
  // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
  metrics.addMetric('latency', MetricUnit.Milliseconds, 56);

  const singleMetric = metrics.singleMetric();
  // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
  singleMetric.addDimension('metricType', 'business');
  singleMetric.addMetric('orderSubmitted', MetricUnit.Count, 1);
};

export const handler = middy(lambdaHandler).use(logMetrics(metrics));
