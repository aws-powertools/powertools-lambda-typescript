import { Tracer } from '@aws-lambda-powertools/tracer';
import axios from 'axios'; // (1)

new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  await axios.get('https://httpbin.org/status/200');
};
