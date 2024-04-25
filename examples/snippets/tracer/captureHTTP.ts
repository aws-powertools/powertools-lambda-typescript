import { Tracer } from '@aws-lambda-powertools/tracer';

new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  await fetch('https://httpbin.org/status/200');
};
