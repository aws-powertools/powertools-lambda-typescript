import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';

const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
    metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
};

export const handler = middy(lambdaHandler)
    .use(logMetrics(metrics, { captureColdStartMetric: true }));