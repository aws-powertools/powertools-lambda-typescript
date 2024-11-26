import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import type { Context } from 'aws-lambda';
import middy from 'middy5';
import { Tracer } from '../../src/index.js';
import { captureLambdaHandler } from '../../src/middleware/middy.js';
import {
  EXPECTED_ANNOTATION_KEY as customAnnotationKey,
  EXPECTED_ANNOTATION_VALUE as customAnnotationValue,
  EXPECTED_ERROR_MESSAGE as customErrorMessage,
  EXPECTED_METADATA_KEY as customMetadataKey,
  EXPECTED_METADATA_VALUE as customMetadataValue,
} from './constants.js';

type CustomEvent = {
  throw: boolean;
  invocation: number;
};

const tracer = new Tracer();
const dynamoDB = tracer.captureAWSv3Client(new DynamoDBClient({}));

export const handler = middy(
  async (event: CustomEvent, _context: Context): Promise<string> => {
    tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
    tracer.putMetadata(customMetadataKey, customMetadataValue);

    await dynamoDB.send(
      new PutItemCommand({
        TableName: process.env.TEST_TABLE_NAME ?? 'TestTable',
        Item: {
          id: {
            S: `${process.env.POWERTOOLS_SERVICE_NAME ?? 'service'}-${event.invocation}-sdkv3`,
          },
        },
      })
    );
    await fetch('https://docs.powertools.aws.dev/lambda/typescript/latest/');

    if (event.throw) {
      throw new Error(customErrorMessage);
    }

    return 'success';
  }
).use(captureLambdaHandler(tracer, { captureResponse: false }));
