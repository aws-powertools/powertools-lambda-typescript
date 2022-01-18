import middy from '@middy/core';
import { Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { captureLambdaHandler, Tracer } from '@aws-lambda-powertools/tracer';

// Disable Tracer by setting POWERTOOLS_TRACE_ENABLED = 'false' in the function environment variables - https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
const tracer = new Tracer({ serviceName: 'tracerDisabledFn', enabled: false });

// In this example we are using the middleware pattern but the same applies also the captureLambdaHandler decorator or to manual instrumentation
const lambdaHandler = async (event: typeof Events.Custom.CustomEvent, context: Context): Promise<unknown> => {
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
};

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
