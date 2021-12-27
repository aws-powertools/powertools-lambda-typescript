import middy from '@middy/core';
import { Tracer } from '../Tracer';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

/**
 * A middy middleware automating capture of metadata and annotations on segments or subsegments ofr a Lambda Handler.
 * 
 * Using this middleware on your handler function will automatically:
 * * handle the subsegment lifecycle 
 * * add the `ColdStart` annotation
 * * add the function response as metadata
 * * add the function error as metadata (if any)
 * 
 * @example
 * ```typescript
 * import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
 * import middy from '@middy/core';
 * 
 * const tracer = new Tracer({ serviceName: 'my-service' });
 * 
 * export const handler = middy(async (_event: any, _context: any) => {
 *   ...
 * }).use(captureLambdaHandler(tracer));
 * ```
 * 
 * @param tracer - The Tracer instance to use for tracing
 * @returns middleware object - The middy middleware object
 */
const captureLambdaHandler = (target: Tracer): middy.MiddlewareObj => {
  let lambdaSegment: Subsegment | Segment;

  const open = (): void => {
    lambdaSegment = target.getSegment();
    const handlerSegment = lambdaSegment.addNewSubsegment(`## ${process.env._HANDLER}`);
    target.setSegment(handlerSegment);
  };

  const close = (): void => {
    const subsegment = target.getSegment();
    subsegment?.close();
    target.setSegment(lambdaSegment as Segment);
  };

  const captureLambdaHandlerBefore = async (_request: middy.Request): Promise<void> => {
    if (target.isTracingEnabled()) {
      open();
      target.annotateColdStart();
      target.addServiceNameAnnotation();
    }
  };
  
  const captureLambdaHandlerAfter = async (request: middy.Request): Promise<void> => {
    if (target.isTracingEnabled()) {
      target.addResponseAsMetadata(request.response, process.env._HANDLER);
      close();
    }
  };
  
  const captureLambdaHandlerError = async (request: middy.Request): Promise<void> => {
    if (target.isTracingEnabled()) {
      target.addErrorAsMetadata(request.error as Error);
      // TODO: should this error be thrown?? I.e. should we stop the event flow & return?
      // throw request.error;
      close();
    }
  };

  return {
    before: captureLambdaHandlerBefore,
    after: captureLambdaHandlerAfter,
    onError: captureLambdaHandlerError
  };
};

export { 
  captureLambdaHandler,
};