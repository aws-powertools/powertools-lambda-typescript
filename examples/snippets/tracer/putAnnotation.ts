import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  const handlerSegment = tracer.getSegment()?.addNewSubsegment('### handler');
  handlerSegment && tracer.setSegment(handlerSegment); // (1)!

  tracer.putAnnotation('successfulBooking', true);

  handlerSegment?.close();
  handlerSegment && tracer.setSegment(handlerSegment?.parent); // (2)!
};
