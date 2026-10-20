import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

const lambdaHandler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  tracer.putAnnotation('successfulBooking', true);
};

// Wrap the handler with middy
export const handler = middy(lambdaHandler)
  // Use the middleware by passing the Tracer instance as a parameter
  .use(captureLambdaHandler(tracer));
