import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Context } from 'aws-lambda'; 

const metrics = new Metrics({ namespace:'serverlessAirline', serviceName:'orders' });

export const handler = async (event: any, context: Context): Promise<void> => {
    metrics.addMetric('performedActionA', MetricUnits.Count, 2);
    // do something else...
    metrics.addMetric('performedActionA', MetricUnits.Count, 1);
};