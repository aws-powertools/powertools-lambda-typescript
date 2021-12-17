import middy from '@middy/core';
import { Subsegment } from 'aws-xray-sdk-core';
import { Tracer } from '../Tracer';

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
  const captureLambdaHandlerBefore = async (request: middy.Request): Promise<void> => {
    if (target.isTracingEnabled()) {
      const subsegment = new Subsegment(`## ${request.context.functionName}`);
      target.setSegment(subsegment);
  
      if (Tracer.isColdStart()) {
        target.putAnnotation('ColdStart', true);
      }
    }
  };

  const captureLambdaHandlerAfter = async (request: middy.Request): Promise<void> => {
    if (target.isTracingEnabled()) {
      const subsegment = target.getSegment();
      if (request.response !== undefined && target.isCaptureResponseEnabled() === true) {
        target.putMetadata(`${request.context.functionName} response`, request.response);
      }
      
      subsegment?.close();
    }
  };

  const captureLambdaHandlerError = async (request: middy.Request): Promise<void> => {
    if (target.isTracingEnabled()) {
      const subsegment = target.getSegment();
      if (target.isCaptureErrorEnabled() === false) {  
        subsegment?.addErrorFlag();
      } else {
        subsegment?.addError(request.error as Error, false);
      }
      // TODO: should this error be thrown?? I.e. should we stop the event flow & return?
      // throw request.error;

      subsegment?.close();
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