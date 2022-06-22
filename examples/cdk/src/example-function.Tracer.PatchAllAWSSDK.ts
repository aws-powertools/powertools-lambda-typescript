import { Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'tracerPatchAllAWSSDKFn' });
// Alternatively, you can also set the service name using the POWERTOOLS_SERVICE_NAME environment variable
// Learn more at: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html

// To patch all AWS SDKs v2, we need to import aws-sdk and pass it to the Tracer
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = tracer.captureAWS(require('aws-sdk'));
// Then we can use the AWS SDK as usual
const sts = new AWS.STS();

// Here we are showing an example with manual instrumentation, but you can do the same also with the captureLambdaHandler Middy Middleware and Class decorator
// See: https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/#lambda-handler
export const handler = async (_event: typeof Events.Custom.CustomEvent, _context: Context): Promise<unknown> => {
  const segment = tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
  // Create subsegment for the function & set it as active
  const subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
  tracer.setSegment(subsegment);
  
  let res;
  try {
    // Tracer will create a subsegment for the AWS SDK call and capture relevant annotations and metadata
    res = await sts.getCallerIdentity({}).promise();
    // Add the response as metadata 
    tracer.addResponseAsMetadata(res, process.env._HANDLER);
  } catch (err) {
    // Add error as metadata to the current subsegment
    tracer.addErrorAsMetadata(err as Error);
    throw err;
  } finally {
    // Close subsegment (the AWS Lambda one is closed automatically)
    subsegment.close();
    // Set back the facade segment as active again
    tracer.setSegment(segment);
  }

  return res;
};