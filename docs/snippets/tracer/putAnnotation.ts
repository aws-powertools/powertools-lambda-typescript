import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (_event: any, _context: any): Promise<void> => {
    tracer.putAnnotation('successfulBooking', true);
};