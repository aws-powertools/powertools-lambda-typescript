import { Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { Tracer } from '@aws-lambda-powertools/tracer';

// process.env.POWERTOOLS_SERVICE_NAME = 'tracerManualFn'; // Alternative to setting the service name in the constructor
const tracer = new Tracer({ serviceName: 'tracerManualFn' });

export const handler = async (event: typeof Events.Custom.CustomEvent, context: Context): Promise<unknown> => {
  const segment = tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
  // Create subsegment for the function & set it as active
  const subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
  tracer.setSegment(subsegment);

  // Annotate the subsegment with the cold start & serviceName
  tracer.annotateColdStart();
  tracer.addServiceNameAnnotation();

  // Add custom annotation & metadata
  tracer.putAnnotation('awsRequestId', context.awsRequestId);
  tracer.putMetadata('eventPayload', event);

  let res;
  try {
    res = { foo: 'bar' };
    // Add the response as metadata 
    tracer.addResponseAsMetadata(res, process.env._HANDLER);
  } catch (err) {
    // Add the error as metadata
    tracer.addErrorAsMetadata(err as Error);
    throw err;
  } finally {
    // Close subsegment (the AWS Lambda one is closed automatically)
    subsegment.close();
    // Set the facade segment as active again
    tracer.setSegment(segment);
  }

  return res;
};