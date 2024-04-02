import { Tracer } from '../../src/index.js';
import type { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

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
const customSubSegmentName =
  process.env.EXPECTED_CUSTOM_SUBSEGMENT_NAME ?? 'mySubsegment';

interface CustomEvent {
  throw: boolean;
  invocation: number;
}

const tracer = new Tracer({ serviceName: serviceName });
const dynamoDB = tracer.captureAWSv3Client(
  DynamoDBDocumentClient.from(new DynamoDBClient({}))
);

export class MyFunctionBase {
  private readonly returnValue: string;

  public constructor() {
    this.returnValue = customResponseValue;
  }

  public async handler(
    event: CustomEvent,
    _context: Context
  ): Promise<unknown> {
    tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
    tracer.putMetadata(customMetadataKey, customMetadataValue);

    try {
      await dynamoDB.send(
        new PutCommand({
          TableName: testTableName,
          Item: { id: `${serviceName}-${event.invocation}-sdkv3` },
        })
      );
      await fetch('https://docs.powertools.aws.dev/lambda/typescript/latest/');

      const res = this.myMethod();
      if (event.throw) {
        throw new Error(customErrorMessage);
      }

      return res;
    } catch (err) {
      throw err;
    }
  }

  public myMethod(): string {
    return this.returnValue;
  }
}

class MyFunctionWithDecorator extends MyFunctionBase {
  @tracer.captureLambdaHandler()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handler(
    event: CustomEvent,
    _context: Context
  ): Promise<unknown> {
    return super.handler(event, _context);
  }

  @tracer.captureMethod()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public myMethod(): string {
    return super.myMethod();
  }
}

const handlerClass = new MyFunctionWithDecorator();
export const handler = handlerClass.handler.bind(handlerClass);

export class MyFunctionWithDecoratorAndCustomNamedSubSegmentForMethod extends MyFunctionBase {
  @tracer.captureLambdaHandler()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handler(
    event: CustomEvent,
    _context: Context
  ): Promise<unknown> {
    return super.handler(event, _context);
  }

  @tracer.captureMethod({ subSegmentName: customSubSegmentName })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public myMethod(): string {
    return super.myMethod();
  }
}

const handlerWithCustomSubsegmentNameInMethodClass =
  new MyFunctionWithDecoratorAndCustomNamedSubSegmentForMethod();
export const handlerWithCustomSubsegmentNameInMethod =
  handlerClass.handler.bind(handlerWithCustomSubsegmentNameInMethodClass);
