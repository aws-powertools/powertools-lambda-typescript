import middy from '@middy/core';
import { Tracer } from '../../src/index.js';
import { captureLambdaHandler } from '../../src/middleware/middy.js';
import type { Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
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
const dynamoDB = tracer.captureAWSv3Client(new DynamoDBClient({}));

const testHandler = async (
  event: CustomEvent,
  _context: Context
): Promise<void> => {
  tracer.putAnnotation('invocation', event.invocation);
  tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
  tracer.putMetadata(customMetadataKey, customMetadataValue);

  try {
    await dynamoDB.send(
      new PutItemCommand({
        TableName: testTableName,
        Item: { id: { S: `${serviceName}-${event.invocation}-sdkv3` } },
      })
    );
    await httpRequest({
      hostname: 'docs.powertools.aws.dev',
      path: '/lambda/typescript/latest/',
      protocol: 'https',
      timeout: 5000,
    });

    const res = customResponseValue;
    if (event.throw) {
      throw new Error(customErrorMessage);
    }

    return res;
  } catch (err) {
    throw err;
  }
};

export const handler = middy(testHandler).use(captureLambdaHandler(tracer));

export const handlerWithNoCaptureResponseViaMiddlewareOption = middy(
  testHandler
).use(captureLambdaHandler(tracer, { captureResponse: false }));
