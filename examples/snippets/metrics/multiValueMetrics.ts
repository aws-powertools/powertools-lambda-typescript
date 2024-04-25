import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('performedActionA', MetricUnit.Count, 2);
  // do something else...
  metrics.addMetric('performedActionA', MetricUnit.Count, 1);
};
