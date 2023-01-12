import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (_event: any, _context: any): Promise<void> => {
    const res; /* ... */
    tracer.putMetadata('paymentResponse', res);
};