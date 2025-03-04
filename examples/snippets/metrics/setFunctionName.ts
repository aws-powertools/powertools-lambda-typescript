import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

// Setting function name must come before calling `captureColdStartMetric`
metrics.setFunctionName('my-function-name');

// Ensure we emit the cold start
metrics.captureColdStartMetric();

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
};
