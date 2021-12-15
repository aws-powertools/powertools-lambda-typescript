import middy from '@middy/core';
import { Subsegment } from 'aws-xray-sdk-core';
import { Tracer } from '../Tracer';

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
      // throw error;
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