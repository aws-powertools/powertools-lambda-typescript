import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';

// process.env.POWERTOOLS_SERVICE_NAME = 'tracerManualFn'; // Alternative to setting the service name in the constructor
const tracer = new Tracer({ serviceName: 'tracerMiddlewareFn' });

// We instrument the handler with the middy middleware and the tracer will automatically create a subsegment and capture relevant annotations and metadata
export const handler = middy(async (event: typeof Events.Custom.CustomEvent, context: Context) => {
  // Add custom annotation & metadata
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