import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  const metricTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  metrics.setTimestamp(metricTimestamp);
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
};
