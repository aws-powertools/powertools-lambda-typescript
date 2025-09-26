import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async () => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('subsegment');
  subsegment?.addAnnotation('annotationKey', 'annotationValue');
  subsegment?.addMetadata('metadataKey', { foo: 'bar' });
  subsegment?.close();
};
