import middy from '@middy/core';
import { captureLambdaHandler, Tracer } from '../../src';
import { Context } from 'aws-lambda';

const serviceName = process.env.EXPECTED_SERVICE_NAME ?? 'MyFunctionWithStandardHandler';
const customAnnotationKey = process.env.EXPECTED_CUSTOM_ANNOTATION_KEY ?? 'myAnnotation';
const customAnnotationValue = process.env.EXPECTED_CUSTOM_ANNOTATION_VALUE ?? 'myValue';
const customMetadataKey = process.env.EXPECTED_CUSTOM_METADATA_KEY ?? 'myMetadata';
const customMetadataValue = JSON.parse(process.env.EXPECTED_CUSTOM_METADATA_VALUE) ?? { bar: 'baz' };
const customResponseValue = JSON.parse(process.env.EXPECTED_CUSTOM_RESPONSE_VALUE) ?? { foo: 'bar' };
const customErrorMessage = process.env.EXPECTED_CUSTOM_ERROR_MESSAGE ?? 'An error has occurred';

interface CustomEvent {
  throw: boolean
}

const tracer = new Tracer({ serviceName: serviceName, enabled: false });

export const handler = middy(async (event: CustomEvent, _context: Context): Promise<void> => {
  tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
  tracer.putMetadata(customMetadataKey, customMetadataValue);

  let res;
  try {
    res = customResponseValue;
    if (event.throw) {
      throw new Error(customErrorMessage);
    }
  } catch (err) {
    throw err;
  }

  return res;
}).use(captureLambdaHandler(tracer));