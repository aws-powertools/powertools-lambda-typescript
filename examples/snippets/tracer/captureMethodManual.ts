import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Subsegment } from 'aws-xray-sdk-core';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

const getChargeId = async (): Promise<unknown> => {
  const parentSubsegment = tracer.getSegment(); // This is the subsegment currently active
  let subsegment: Subsegment | undefined;
  subsegment = parentSubsegment?.addNewSubsegment('### chargeId');
  subsegment && tracer.setSegment(subsegment);

  try {
    const res = { chargeId: '1234' };

    // Add the response as metadata
    tracer.addResponseAsMetadata(res, 'chargeId');

    return res;
  } catch (err) {
    // Add the error as metadata
    tracer.addErrorAsMetadata(err as Error);
    throw err;
  } finally {
    // Close subsegment
    subsegment?.close();
    // Set the facade segment as active again, it'll be closed automatically
    parentSubsegment && tracer.setSegment(parentSubsegment);
  }
};

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  await getChargeId();
};
