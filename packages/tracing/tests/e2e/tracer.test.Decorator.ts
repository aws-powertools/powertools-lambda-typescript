import { Tracer } from '../../src';
import { Callback, Context } from 'aws-lambda';

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

const tracer = new Tracer({ serviceName: serviceName });

export class MyFunctionWithDecorator {  
  @tracer.captureLambdaHandler()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public handler(event: CustomEvent, _context: Context, _callback: Callback<unknown>): void | Promise<unknown> {
    tracer.putAnnotation(customAnnotationKey, customAnnotationValue);
    tracer.putMetadata(customMetadataKey, customMetadataValue);

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