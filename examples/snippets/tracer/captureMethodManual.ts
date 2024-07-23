import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Subsegment } from 'aws-xray-sdk-core';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

const getChargeId = async (): Promise<unknown> => {
  const parentSubsegment = tracer.getSegment(); // This is the subsegment currently active
  let subsegment: Subsegment | undefined;
  if (parentSubsegment) {
    // Create subsegment for the function & set it as active
    subsegment = parentSubsegment.addNewSubsegment('### chargeId');
    tracer.setSegment(subsegment);
  }

  let res: unknown;
  try {
    /* ... */
    // Add the response as metadata
    tracer.addResponseAsMetadata(res, 'chargeId');
  } catch (err) {
    // Add the error as metadata
    tracer.addErrorAsMetadata(err as Error);
    throw err;
  }

  if (parentSubsegment && subsegment) {
    // Close subsegment (the AWS Lambda one is closed automatically)
    subsegment.close();
    // Set the facade segment as active again
    tracer.setSegment(parentSubsegment);
  }

  return res;
};

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  await getChargeId();
};
