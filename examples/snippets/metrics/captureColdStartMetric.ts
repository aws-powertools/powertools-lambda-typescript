import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.captureColdStartMetric('my-function-name');

  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);

  metrics.publishStoredMetrics();
};
