import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (_event, _context): Promise<void> => {
  tracer.getSegment();
};
