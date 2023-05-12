import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('performedActionA', MetricUnits.Count, 2);
  // do something else...
  metrics.addMetric('performedActionA', MetricUnits.Count, 1);
};
