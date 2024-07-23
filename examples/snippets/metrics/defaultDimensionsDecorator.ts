import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});
const DEFAULT_DIMENSIONS = { environment: 'prod', foo: 'bar' };

export class Lambda implements LambdaInterface {
  // Decorate your handler class method
  @metrics.logMetrics({ defaultDimensions: DEFAULT_DIMENSIONS })
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); // (1)
