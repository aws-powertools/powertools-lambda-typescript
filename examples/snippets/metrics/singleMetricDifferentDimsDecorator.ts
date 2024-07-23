import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

class Lambda implements LambdaInterface {
  @metrics.logMetrics()
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    metrics.addDimension('metricUnit', 'milliseconds');
    // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
    metrics.addMetric('latency', MetricUnit.Milliseconds, 56);

    const singleMetric = metrics.singleMetric();
    // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
    singleMetric.addDimension('metricType', 'business');
    singleMetric.addMetric('orderSubmitted', MetricUnit.Count, 1);
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); // (1)
