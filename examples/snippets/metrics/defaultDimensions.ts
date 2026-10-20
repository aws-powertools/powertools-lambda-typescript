import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
  defaultDimensions: { environment: 'prod', foo: 'bar' },
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
};
