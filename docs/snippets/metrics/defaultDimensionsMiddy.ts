import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
};

// Wrap the handler with middy
export const handler = middy(lambdaHandler)
  // Use the middleware by passing the Metrics instance as a parameter
  .use(
    logMetrics(metrics, {
      defaultDimensions: { environment: 'prod', foo: 'bar' },
    })
  );
