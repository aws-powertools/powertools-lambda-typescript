import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (_event: unknown, _context: unknown): Promise<void> => {
  tracer.putAnnotation('successfulBooking', true);
};