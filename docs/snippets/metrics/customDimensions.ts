import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addDimension('environment', 'prod');
  metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
  metrics.publishStoredMetrics();
};
