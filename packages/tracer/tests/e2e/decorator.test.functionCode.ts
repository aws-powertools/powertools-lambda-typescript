import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  type PutCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import type { Context } from 'aws-lambda';
import { Tracer } from '../../src/index.js';
import { httpRequest } from '../helpers/httpRequest.js';
import {
  EXPECTED_ANNOTATION_KEY as customAnnotationKey,
  EXPECTED_ANNOTATION_VALUE as customAnnotationValue,
  EXPECTED_ERROR_MESSAGE as customErrorMessage,
  EXPECTED_METADATA_KEY as customMetadataKey,
  EXPECTED_METADATA_VALUE as customMetadataValue,
  EXPECTED_RESPONSE_VALUE as customResponseValue,
  EXPECTED_SUBSEGMENT_NAME as customSubSegmentName,
} from './constants.js';

type CustomEvent = {
  throw: boolean;
  invocation: number;
};

const tracer = new Tracer();
const dynamoDB = tracer.captureAWSv3Client(
  DynamoDBDocumentClient.from(new DynamoDBClient({}))
);

export class LambdaFunction {
  private readonly returnValue: Record<string, unknown>;

  public constructor() {
    this.returnValue = customResponseValue;
  }

  @tracer.captureLambdaHandler()
  public async handler(
    event: CustomEvent,
    _context: Context
  ): Promise<unknown> {
    tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
    tracer.putMetadata(customMetadataKey, customMetadataValue);

    await this.methodNoResponse(event.invocation);
    await httpRequest({
      hostname: 'docs.powertools.aws.dev',
      path: '/lambda/typescript/latest/',
    });

    const res = this.myMethod();

    if (event.throw) {
      throw new Error(customErrorMessage);
    }

    return res;
  }

  @tracer.captureMethod({ subSegmentName: customSubSegmentName })
  public myMethod(): Record<string, unknown> {
    return this.returnValue;
  }

  @tracer.captureMethod({ captureResponse: false })
  private async methodNoResponse(
    invocationIdx: number
  ): Promise<PutCommandOutput> {
    return await dynamoDB.send(
      new PutCommand({
        TableName: process.env.TEST_TABLE_NAME ?? 'TestTable',
        Item: {
          id: `${process.env.POWERTOOLS_SERVICE_NAME ?? 'service'}-${invocationIdx}-sdkv3`,
        },
      })
    );
  }
}

const lambda = new LambdaFunction();
export const handler = lambda.handler.bind(lambda);
