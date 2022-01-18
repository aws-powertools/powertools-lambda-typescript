import { Callback, Context } from 'aws-lambda';
import { Events } from '@aws-lambda-powertools/commons';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'tracerDecoratorFn' });
// Alternatively, you can also set the service name using the POWERTOOLS_SERVICE_NAME environment variable
// Learn more at: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html

export class MyFunctionWithDecorator {  
  // We instrument the handler with the decorator and the tracer will automatically create a subsegment and capture relevant annotations and metadata
  @tracer.captureLambdaHandler()
  public handler(event: typeof Events.Custom.CustomEvent, context: Context, _callback: Callback<unknown>): void | Promise<unknown> {
    // Add custom annotation & metadata
    tracer.putAnnotation('awsRequestId', context.awsRequestId);
    tracer.putMetadata('eventPayload', event);

    let res: { foo: string };
    try {
      res = { foo: this.myMethod() };
    } catch (err) {
      throw err;
    }

    return new Promise((resolve, _reject) => resolve(res as unknown));
  }

  // We can also use decorators to create a subsegment for the method & capture response and errors as metadata
  @tracer.captureMethod()
  public myMethod(): string {
    return 'bar';
  }
}

export const handlerClass = new MyFunctionWithDecorator();
export const handler = handlerClass.handler;