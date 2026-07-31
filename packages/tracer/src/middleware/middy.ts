import { TRACER_KEY } from '@aws-lambda-powertools/commons';
import type {
  MiddlewareLikeObj,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import type { Tracer } from '../Tracer.js';
import type { CaptureLambdaHandlerOptions } from '../types/Tracer.js';

/**
 * A middy middleware automating capture of metadata and annotations on segments or subsegments for a Lambda Handler.
 *
 * Using this middleware on your handler function will automatically:
 * - handle the subsegment lifecycle
 * - add the `ColdStart` annotation
 * - add the function response as metadata
 * - add the function error as metadata (if any)
 *
 * @example
 * ```typescript
 * import { Tracer } from '@aws-lambda-powertools/tracer';
 * import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
 * import middy from '@middy/core';
 *
 * const tracer = new Tracer({ serviceName: 'serverlessAirline' });
 *
 * const lambdaHandler = async (_event: any, _context: any) => {
 *   ...
 * };
 *
 * export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
 * ```
 *
 * @param target - The Tracer instance to use for tracing
 * @param options - (_optional_) Options for the middleware
 */
const captureLambdaHandler = (
  target: Tracer,
  options?: CaptureLambdaHandlerOptions
): MiddlewareLikeObj => {
  // The segments are stored in `request.internal` rather than in variables scoped
  // to this factory so that each invocation operates on its own segments when
  // multiple invocations run concurrently in the same execution environment.
  const lambdaSegmentKey = `${TRACER_KEY}.lambdaSegment`;
  const handlerSegmentKey = `${TRACER_KEY}.handlerSegment`;

  /**
   * Set the cleanup function to be called in case other middlewares return early.
   *
   * @param request - The request object
   */
  const setCleanupFunction = (request: MiddyLikeRequest): void => {
    request.internal = {
      ...request.internal,
      [TRACER_KEY]: close,
    };
  };

  const open = (request: MiddyLikeRequest): void => {
    const segment = target.getSegment();
    if (segment === undefined) {
      return;
    }
    // If segment is defined, then it is a Segment as this middleware is only used for Lambda Handlers
    const lambdaSegment = segment as Segment;
    const handlerSegment = lambdaSegment.addNewSubsegment(
      `## ${process.env._HANDLER}`
    );
    request.internal = {
      ...request.internal,
      [lambdaSegmentKey]: lambdaSegment,
      [handlerSegmentKey]: handlerSegment,
    };
    target.setSegment(handlerSegment);
  };

  const close = (request: MiddyLikeRequest): void => {
    const lambdaSegment = request.internal[lambdaSegmentKey] as
      | Segment
      | undefined;
    const handlerSegment = request.internal[handlerSegmentKey] as
      | Subsegment
      | undefined;
    if (handlerSegment === undefined || lambdaSegment === undefined) {
      return;
    }
    try {
      handlerSegment.close();
    } catch (error) {
      console.warn(
        'Failed to close or serialize segment %s. We are catching the error but data might be lost.',
        handlerSegment.name,
        error
      );
    }
    target.setSegment(lambdaSegment);
  };

  const before = (request: MiddyLikeRequest) => {
    if (target.isTracingEnabled()) {
      open(request);
      setCleanupFunction(request);
      target.annotateColdStart();
      target.addServiceNameAnnotation();
    }
  };

  const after = (request: MiddyLikeRequest) => {
    if (target.isTracingEnabled()) {
      if (options?.captureResponse ?? true) {
        target.addResponseAsMetadata(request.response, process.env._HANDLER);
      }
      close(request);
    }
  };

  const onError = (request: MiddyLikeRequest) => {
    if (target.isTracingEnabled()) {
      target.addErrorAsMetadata(request.error as Error);
      close(request);
    }
  };

  return {
    before,
    after,
    onError,
  };
};

export { captureLambdaHandler };
