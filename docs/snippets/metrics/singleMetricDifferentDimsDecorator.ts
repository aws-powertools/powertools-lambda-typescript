import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    metrics.addDimension('metricUnit', 'milliseconds');
    // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
    metrics.addMetric('latency', MetricUnits.Milliseconds, 56);
    
    const singleMetric = metrics.singleMetric();
    // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
    singleMetric.addDimension('metricType', 'business');
    singleMetric.addMetric('orderSubmitted', MetricUnits.Count, 1);
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); // (1)