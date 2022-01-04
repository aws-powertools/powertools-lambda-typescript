import { Tracer } from '../../src';
import { Context } from 'aws-lambda';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
// eslint-disable-next-line @typescript-eslint/no-var-requires
let AWS = require('aws-sdk');

const serviceName = process.env.EXPECTED_SERVICE_NAME ?? 'MyFunctionWithStandardHandler';
const customAnnotationKey = process.env.EXPECTED_CUSTOM_ANNOTATION_KEY ?? 'myAnnotation';
const customAnnotationValue = process.env.EXPECTED_CUSTOM_ANNOTATION_VALUE ?? 'myValue';
const customMetadataKey = process.env.EXPECTED_CUSTOM_METADATA_KEY ?? 'myMetadata';
const customMetadataValue = JSON.parse(process.env.EXPECTED_CUSTOM_METADATA_VALUE) ?? { bar: 'baz' };
const customResponseValue = JSON.parse(process.env.EXPECTED_CUSTOM_RESPONSE_VALUE) ?? { foo: 'bar' };
const customErrorMessage = process.env.EXPECTED_CUSTOM_ERROR_MESSAGE ?? 'An error has occurred';

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
const stsv3 = tracer.captureAWSv3Client(new STSClient({}));

export class MyFunctionWithDecorator {  
  @tracer.captureLambdaHandler()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handler(event: CustomEvent, _context: Context): Promise<unknown> {
    tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
    tracer.putMetadata(customMetadataKey, customMetadataValue);

    let stsv2;
    refreshAWSSDKImport();
    if (event.sdkV2 === 'client') {
      stsv2 = tracer.captureAWSClient(new AWS.STS());
    } else if (event.sdkV2 === 'all') {
      AWS = tracer.captureAWS(AWS);
      stsv2 = new AWS.STS();
    }

    try {
      await stsv2.getCallerIdentity().promise();
    } catch (err) {
      console.error(err);
    }

    try {
      await stsv3.send(new GetCallerIdentityCommand({}));
    } catch (err) {
      console.error(err);
    }

    let res;
    try {
      res = this.myMethod();
      if (event.throw) {
        throw new Error(customErrorMessage);
      }
    } catch (err) {
      throw err;
    }

    return res;
  }

  @tracer.captureMethod()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public myMethod(): string {
    return customResponseValue;
  }
}

export const handlerClass = new MyFunctionWithDecorator();
export const handler = handlerClass.handler;