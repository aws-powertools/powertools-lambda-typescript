import { Tracer } from '../../src';
import { Callback, Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
let AWS = require('aws-sdk');

const serviceName = process.env.EXPECTED_SERVICE_NAME ?? 'MyFunctionWithStandardHandler';
const customAnnotationKey = process.env.EXPECTED_CUSTOM_ANNOTATION_KEY ?? 'myAnnotation';
const customAnnotationValue = process.env.EXPECTED_CUSTOM_ANNOTATION_VALUE ?? 'myValue';
const customMetadataKey = process.env.EXPECTED_CUSTOM_METADATA_KEY ?? 'myMetadata';
const customMetadataValue = JSON.parse(process.env.EXPECTED_CUSTOM_METADATA_VALUE) ?? { bar: 'baz' };
const customResponseValue = JSON.parse(process.env.EXPECTED_CUSTOM_RESPONSE_VALUE) ?? { foo: 'bar' };
const customErrorMessage = process.env.EXPECTED_CUSTOM_ERROR_MESSAGE ?? 'An error has occurred';
const testTableName = process.env.TEST_TABLE_NAME ?? 'TestTable';

interface CustomEvent {
  throw: boolean
  sdkV2: string
  invocation: number
}

// Function that refreshes imports to ensure that we are instrumenting only one version of the AWS SDK v2 at a time.
const refreshAWSSDKImport = (): void => {
  // Clean up the require cache to ensure we're using a newly imported version of the AWS SDK v2
  for (const key in require.cache) {
    if (key.indexOf('/aws-sdk/') !== -1) {
      delete require.cache[key];
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AWS = require('aws-sdk');
};

const tracer = new Tracer({ serviceName: serviceName });
const dynamoDBv3 = tracer.captureAWSv3Client(new DynamoDBClient({}));

export class MyFunctionWithDecorator {  
  private readonly returnValue: string;

  public constructor() {
    this.returnValue = customResponseValue;
  }

  @tracer.captureLambdaHandler()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public handler(event: CustomEvent, _context: Context, _callback: Callback<unknown>): void | Promise<unknown> {
    tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
    tracer.putMetadata(customMetadataKey, customMetadataValue);

    let dynamoDBv2;
    refreshAWSSDKImport();
    if (event.sdkV2 === 'client') {
      dynamoDBv2 = tracer.captureAWSClient(new AWS.DynamoDB.DocumentClient());
    } else if (event.sdkV2 === 'all') {
      AWS = tracer.captureAWS(AWS);
      dynamoDBv2 = new AWS.DynamoDB.DocumentClient();
    }
    
    return Promise.all([
      dynamoDBv2.put({ TableName: testTableName, Item: { id: `${serviceName}-${event.invocation}-sdkv2` } }).promise(),
      dynamoDBv3.send(new PutItemCommand({ TableName: testTableName, Item: { id: { 'S': `${serviceName}-${event.invocation}-sdkv3` } } })),
      axios.get('https://httpbin.org/status/200'),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const res = this.myMethod();
          if (event.throw) {
            reject(new Error(customErrorMessage));
          } else {
            resolve(res);
          }
        }, 2000); // We need to wait for to make sure previous calls are finished
      })
    ])
      .then(([ _dynamoDBv2Res, _dynamoDBv3Res, _axiosRes, promiseRes ]) => promiseRes)
      .catch((err) => {
        throw err;
      });
  }

  @tracer.captureMethod()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public myMethod(): string {
    return this.returnValue;
  }
}

const handlerClass = new MyFunctionWithDecorator();
export const handler = handlerClass.handler.bind(handlerClass);