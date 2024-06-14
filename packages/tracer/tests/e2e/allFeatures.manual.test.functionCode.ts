import { Tracer } from '../../src/index.js';
import type { Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import type { Subsegment } from 'aws-xray-sdk-core';
import { httpRequest } from '../helpers/httpRequest.js';

const serviceName =
  process.env.EXPECTED_SERVICE_NAME ?? 'MyFunctionWithStandardHandler';
const customAnnotationKey =
  process.env.EXPECTED_CUSTOM_ANNOTATION_KEY ?? 'myAnnotation';
const customAnnotationValue =
  process.env.EXPECTED_CUSTOM_ANNOTATION_VALUE ?? 'myValue';
const customMetadataKey =
  process.env.EXPECTED_CUSTOM_METADATA_KEY ?? 'myMetadata';
const customMetadataValue = process.env.EXPECTED_CUSTOM_METADATA_VALUE
  ? JSON.parse(process.env.EXPECTED_CUSTOM_METADATA_VALUE)
  : { bar: 'baz' };
const customResponseValue = process.env.EXPECTED_CUSTOM_RESPONSE_VALUE
  ? JSON.parse(process.env.EXPECTED_CUSTOM_RESPONSE_VALUE)
  : { foo: 'bar' };
const customErrorMessage =
  process.env.EXPECTED_CUSTOM_ERROR_MESSAGE ?? 'An error has occurred';
const testTableName = process.env.TEST_TABLE_NAME ?? 'TestTable';

interface CustomEvent {
  throw: boolean;
  invocation: number;
}

const tracer = new Tracer({ serviceName: serviceName });
const dynamoDB = tracer.captureAWSClient(new AWS.DynamoDB.DocumentClient());

export const handler = async (
  event: CustomEvent,
  _context: Context
): Promise<void> => {
  const segment = tracer.getSegment();
  let subsegment: Subsegment | undefined;
  if (segment) {
    subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
    tracer.setSegment(subsegment);
  }

  tracer.annotateColdStart();
  tracer.addServiceNameAnnotation();

  tracer.putAnnotation('invocation', event.invocation);
  tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
  tracer.putMetadata(customMetadataKey, customMetadataValue);

  try {
    await dynamoDB
      .put({
        TableName: testTableName,
        Item: { id: `${serviceName}-${event.invocation}-sdkv2` },
      })
      .promise();
    await httpRequest({
      hostname: 'docs.powertools.aws.dev',
      path: '/lambda/typescript/latest/',
    });

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
