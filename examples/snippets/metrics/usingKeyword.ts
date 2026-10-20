import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  using _ = metrics; // (1)!
  metrics.addMetric('successfulBooking', MetricUnit.Count, 10);
  // metrics are flushed automatically when the scope exits, including on errors
};
