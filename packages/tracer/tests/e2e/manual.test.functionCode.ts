import type { Subsegment } from 'aws-xray-sdk-core';
import { Tracer } from '../../src/index.js';
import {
  EXPECTED_ANNOTATION_KEY as customAnnotationKey,
  EXPECTED_ANNOTATION_VALUE as customAnnotationValue,
  EXPECTED_ERROR_MESSAGE as customErrorMessage,
  EXPECTED_METADATA_KEY as customMetadataKey,
  EXPECTED_METADATA_VALUE as customMetadataValue,
  EXPECTED_RESPONSE_VALUE as customResponseValue,
} from './constants.js';

type CustomEvent = {
  throw: boolean;
  invocation: number;
};

const tracer = new Tracer({ captureHTTPsRequests: false });

export const handler = async (
  event: CustomEvent
): Promise<Record<string, unknown>> => {
  const segment = tracer.getSegment();
  let subsegment: Subsegment | undefined;
  if (segment) {
    subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
    tracer.setSegment(subsegment);
  }

  tracer.annotateColdStart();
  tracer.addServiceNameAnnotation();

  tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
  tracer.putMetadata(customMetadataKey, customMetadataValue);

  try {
    await fetch('https://docs.powertools.aws.dev/lambda/typescript/latest/');

    const res = customResponseValue;
    if (event.throw) {
      throw new Error(customErrorMessage);
    }
    tracer.addResponseAsMetadata(res, process.env._HANDLER);

    return res;
  } catch (err) {
    tracer.addErrorAsMetadata(err as Error);
    throw err;
  } finally {
    if (segment && subsegment) {
      subsegment.close();
      tracer.setSegment(segment);
    }
  }
};
