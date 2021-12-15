import middy from '@middy/core';
import { Subsegment } from 'aws-xray-sdk-core';
import { Tracer } from '../Tracer';

const captureLambdaHandler = (target: Tracer): middy.MiddlewareObj => {
  let subsegment: Subsegment | undefined;
  const captureLambdaHandlerBefore = async (request: middy.Request): Promise<void> => {
    if (target.isTracingEnabled()) {
      subsegment = new Subsegment(`## ${request.context.functionName}`);
      target.setSegment(subsegment);
  
      if (Tracer.coldStart) {
        target.putAnnotation('ColdStart', true);
      }
    }
  };

  const captureLambdaHandlerAfter = async (request: middy.Request): Promise<void> => {
    if (target.isTracingEnabled()) {
      if (request.error) {
        if (target.isCaptureErrorEnabled() === false) {  
          subsegment?.addErrorFlag();
        } else {
          subsegment?.addError(request.error, false);
        }
        // TODO: should this error be thrown??
        // throw error;
      } else {
        if (request.response !== undefined && target.isCaptureResponseEnabled() === true) {
          target.putMetadata(`${request.context.functionName} response`, request.response);
        }
      }
      
      subsegment?.close();
    }
  };

  return {
    before: captureLambdaHandlerBefore,
    after: captureLambdaHandlerAfter,
  };
};

export { 
  captureLambdaHandler,
};