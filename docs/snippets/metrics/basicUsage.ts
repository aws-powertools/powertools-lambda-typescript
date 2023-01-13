import { Metrics } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

export const handler = async (_event, _context): Promise<void> => {
    // ...
};