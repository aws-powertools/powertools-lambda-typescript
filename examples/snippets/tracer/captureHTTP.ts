import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = middy(
  async (_event: unknown, _context: unknown): Promise<void> => {
    await fetch('https://httpbin.org/status/200');
  }
).use(captureLambdaHandler(tracer));
