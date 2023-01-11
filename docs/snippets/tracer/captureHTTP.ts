import { Tracer } from '@aws-lambda-powertools/tracer';
import axios from 'axios'; // (1)

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (event: unknown, context: Context): Promise<void> => {
    await axios.get('https://httpbin.org/status/200');
};