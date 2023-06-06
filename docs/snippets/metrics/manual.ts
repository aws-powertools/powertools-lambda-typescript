import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnits.Count, 10);
  metrics.publishStoredMetrics();
};
