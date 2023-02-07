import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';

const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

const lambdaHandler = async (_event: unknown, _context: unknown): Promise<void> => {
  metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
};

// Wrap the handler with middy
export const handler = middy(lambdaHandler)
// Use the middleware by passing the Metrics instance as a parameter
  .use(logMetrics(metrics, { defaultDimensions:{ 'environment': 'prod', 'foo': 'bar' } }));