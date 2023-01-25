import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
const DEFAULT_DIMENSIONS = { 'environment': 'prod', 'foo': 'bar' };

export class Lambda implements LambdaInterface {
  // Decorate your handler class method
  @metrics.logMetrics({ defaultDimensions: DEFAULT_DIMENSIONS })
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass); // (1)