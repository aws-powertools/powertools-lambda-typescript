import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { Subsegment } from 'aws-xray-sdk-core';
import type { Middleware, TracerOptions } from '../../types/http.js';

const tracerMiddleware = (
  tracer: Tracer,
  options?: TracerOptions
): Middleware => {
  const { captureResponse = true } = options ?? {};

  return async ({ reqCtx, next }) => {
    if (!tracer.isTracingEnabled() || reqCtx.isHttpStreaming) {
      await next();
      return;
    }

    const url = new URL(reqCtx.req.url);
    const segmentName = `${reqCtx.req.method} ${url.pathname}`;

    const segment = tracer.getSegment();
    let subSegment: Subsegment | undefined;

    if (segment) {
      subSegment = segment.addNewSubsegment(segmentName);
      tracer.setSegment(subSegment);
    }

    tracer.annotateColdStart();
    tracer.addServiceNameAnnotation();

    try {
      await next();

      if (
        captureResponse &&
        reqCtx.res.headers.get('Content-Type') === 'application/json'
      ) {
        const responseBody = await reqCtx.res.clone().json();
        tracer.addResponseAsMetadata(responseBody, segmentName);
      }
    } catch (err) {
      tracer.addErrorAsMetadata(err as Error);
      throw err;
    } finally {
      if (segment && subSegment) {
        try {
          subSegment.close();
        } catch (error) {
          console.warn(
            'Failed to close or serialize segment %s. Data might be lost.',
            subSegment.name,
            error
          );
        }
        tracer.setSegment(segment);
      }
    }
  };
};

export { tracerMiddleware };
