import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

export class MyFunction implements LambdaInterface {

    @metrics.logMetrics({ captureColdStartMetric: true })
    public async handler(_event: any, _context: any): Promise<void> {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    }
}