import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

export class MyFunction implements LambdaInterface {
  @metrics.logMetrics({ captureColdStartMetric: true })
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
  }
}
