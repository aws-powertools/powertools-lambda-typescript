import {
  Metrics,
  MetricUnit,
  MetricResolution,
} from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric(
    'successfulBooking',
    MetricUnit.Count,
    1,
    MetricResolution.High
  );
};
