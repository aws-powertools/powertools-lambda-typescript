import { Tracer } from '@aws-lambda-powertools/tracer';
import axios from 'axios'; // (1)

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (_event: unknown, _context: unknown): Promise<void> => {
  const { data } = await axios.get('https://httpbin.org/status/200');
  tracer.addResponseAsMetadata(data);
};