import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({
    namespace: 'serverlessAirline', 
    serviceName: 'orders', 
    defaultDimensions: { 'environment': 'prod', 'foo': 'bar' } 
});

export const handler = async (_event: any, _context: any): Promise<void> => {
    metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
};