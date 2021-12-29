import { Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { Tracer } from '@aws-lambda-powertools/tracer';

// process.env.POWERTOOLS_SERVICE_NAME = 'tracerManualFn'; // Alternative to setting the service name in the constructor
const tracer = new Tracer({ serviceName: 'tracerPatchAllAWSSDKFn' });
// To patch all AWS SDKs, we need to import aws-sdk and pass it to the Tracer
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = tracer.captureAWS(require('aws-sdk'));
// Then we can use the AWS SDK as usual
const sts = new AWS.STS();

export const handler = async (_event: typeof Events.Custom.CustomEvent, _context: Context): Promise<unknown> => {
  const segment = tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
  // Create subsegment for the function & set it as active
  const subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
  tracer.setSegment(subsegment);
  
  let res;
  try {
    // Tracer will create a subsegment for the AWS SDK call and capture relevant annotations and metadata
    res = await sts.getCallerIdentity({}).promise();
    // Add custom metadata with the response object
    tracer.putMetadata('awsResponse', res);
  } catch (err) {
    throw err;
  }

  // Close subsegment (the AWS Lambda one is closed automatically)
  subsegment.close();
  // Set the facade segment as active again
  tracer.setSegment(segment);

  return res;
};