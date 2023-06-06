import {
  Metrics,
  MetricUnits,
  logMetrics,
} from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
  metrics.addMetadata('bookingId', '7051cd10-6283-11ec-90d6-0242ac120003');
};

export const handler = middy(lambdaHandler).use(logMetrics(metrics));
