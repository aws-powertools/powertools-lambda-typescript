import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';

// Set environment variable to disable capture response
process.env.POWERTOOLS_TRACER_ERROR_RESPONSE = 'false';
const tracer = new Tracer({ serviceName: 'tracerCaptureErrorDisabledFn' });

// In this example we are using the middleware pattern but you could use also the captureLambdaHandler decorator
export const handler = middy(async (event: typeof Events.Custom.CustomEvent, context: Context) => {
  tracer.putAnnotation('awsRequestId', context.awsRequestId);
  tracer.putMetadata('eventPayload', event);

  let res;
  try {
    res = { foo: 'bar' };
    
    // We are throwing an error only for testing purposes to make sure the error response is not captured in the subsegment metadata
    throw new Error('An error occurred.');
  } catch (err) {
    // The error won't be in the subsegment metadata
    throw err;
  }
  
  return res;
}).use(captureLambdaHandler(tracer));