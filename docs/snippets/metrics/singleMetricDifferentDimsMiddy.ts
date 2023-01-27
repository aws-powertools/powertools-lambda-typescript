import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';

const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
    metrics.addDimension('metricUnit', 'milliseconds');
    // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
    metrics.addMetric('latency', MetricUnits.Milliseconds, 56);

    const singleMetric = metrics.singleMetric();
    // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
    singleMetric.addDimension('metricType', 'business');
    singleMetric.addMetric('orderSubmitted', MetricUnits.Count, 1);
};

export const handler = middy(lambdaHandler)
    .use(logMetrics(metrics));