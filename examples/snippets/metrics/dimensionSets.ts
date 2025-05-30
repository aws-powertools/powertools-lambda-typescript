import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  // Add a single dimension
  metrics.addDimension('environment', 'prod');

  // Add a new dimension set
  metrics.addDimensions({
    dimension1: '1',
    dimension2: '2',
  });

  // Add another dimension set
  metrics.addDimensions({
    region: 'us-east-1',
    category: 'books',
  });

  // Add metrics
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  metrics.publishStoredMetrics();
};
