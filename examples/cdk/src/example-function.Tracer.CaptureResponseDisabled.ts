import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';

// Set environment variable to disable capture response - https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
const tracer = new Tracer({ serviceName: 'tracerCaptureResponseDisabledFn' });

// In this example we are using the middleware pattern, but you could use also the captureLambdaHandler decorator
export const handler = middy(async (event: typeof Events.Custom.CustomEvent, context: Context) => {
  tracer.putAnnotation('awsRequestId', context.awsRequestId);
  tracer.putMetadata('eventPayload', event);

  let res;
  try {
    res = { foo: 'bar' };
  } catch (err) {
    throw err;
  }
  
  // The response won't be captured in the subsegment metadata
  return res;
}).use(captureLambdaHandler(tracer));