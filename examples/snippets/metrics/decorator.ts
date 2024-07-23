import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

class Lambda implements LambdaInterface {
  @metrics.logMetrics()
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); // (1)
