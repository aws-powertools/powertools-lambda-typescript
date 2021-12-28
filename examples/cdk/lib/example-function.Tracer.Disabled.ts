import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';

// process.env.POWERTOOLS_TRACE_ENABLED = 'false'; // Alternative to disabling tracing in the constructor
const tracer = new Tracer({ serviceName: 'tracerDisabledFn', enabled: false });

// In this example we are using the middleware pattern but you could use also the captureLambdaHandler decorator or the manual mode
export const handler = middy(async (event: typeof Events.Custom.CustomEvent, context: Context) => {
  // No tracing will be done and the commands will be ignored, this is useful for testing
  tracer.putAnnotation('awsRequestId', context.awsRequestId);
  tracer.putMetadata('eventPayload', event);

  let res;
  try {
    res = { foo: 'bar' };
  } catch (err) {
    throw err;
  }
  
  return res;
}).use(captureLambdaHandler(tracer));