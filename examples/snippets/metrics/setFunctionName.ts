import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

metrics.setFunctionName('my-function-name');

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  // Capture cold start metric
  metrics.captureColdStartMetric();

  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);

  metrics.publishStoredMetrics();
};
