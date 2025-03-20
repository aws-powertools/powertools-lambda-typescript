import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
  functionName: 'my-function-name',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.captureColdStartMetric();

  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);

  metrics.publishStoredMetrics();
};
