import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Subsegment } from 'aws-xray-sdk-core';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<unknown> => {
  const segment = tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
  let subsegment: Subsegment | undefined;
  if (segment) {
    // Create subsegment for the function & set it as active
    subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
    tracer.setSegment(subsegment);
  }

  // Annotate the subsegment with the cold start & serviceName
  tracer.annotateColdStart();
  tracer.addServiceNameAnnotation();

  try {
    // Add the response as metadata
    tracer.addResponseAsMetadata({}, process.env._HANDLER);
  } catch (err) {
    // Add the error as metadata
    tracer.addErrorAsMetadata(err as Error);
    throw err;
  } finally {
    if (segment && subsegment) {
      // Close subsegment (the AWS Lambda one is closed automatically)
      subsegment.close();
      // Set back the facade segment as active again
      tracer.setSegment(segment);
    }
  }

  return {};
};
