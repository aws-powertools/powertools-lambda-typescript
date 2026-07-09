import { TRACER_KEY } from '@aws-lambda-powertools/commons';
import type {
  MiddlewareLikeObj,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import type { Tracer } from '../Tracer.js';
import type { CaptureLambdaHandlerOptions } from '../types/Tracer.js';

/**
 * Keys used to store the per-invocation segments and CLS context in the
 * middy `request.internal` object.
 *
 * Storing this state per-request rather than in factory-closure variables is
 * required for correctness when multiple invocations are multiplexed into the
 * same execution environment (e.g. Lambda Managed Instances with
 * `perExecutionEnvironmentMaxConcurrency` > 1).
 */
const lambdaSegmentKey = `${TRACER_KEY}.lambdaSegment`;
const handlerSegmentKey = `${TRACER_KEY}.handlerSegment`;
const clsContextKey = `${TRACER_KEY}.clsContext`;

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

  /**
   * Open a new handler subsegment inside a fresh CLS context dedicated to
   * this invocation.
   *
   * In Lambda mode the X-Ray SDK enters a single process-wide CLS context at
   * initialization, so `setSegment()` alone writes the active segment into a
   * slot shared by all concurrent invocations. To keep interleaved
   * invocations isolated, we create and enter a new CLS context first: the
   * context tracking in `cls-hooked` is based on `async_hooks` resource
   * creation, so — as long as this function runs synchronously within the
   * `before` hook — every async resource created downstream (the handler and
   * the `after`/`onError` hooks) inherits the new context, while other
   * in-flight invocations keep operating on their own. This mirrors what
   * `captureAsyncFunc` does in the decorator path via `namespace.run()`.
   *
   * The created context prototypally inherits the facade segment from the
   * SDK's root context, and `setSegment()` then shadows it with the handler
   * subsegment for this invocation only.
   *
   * @param request - The request object
   */
  const open = (request: MiddyLikeRequest): void => {
    const segment = target.getSegment();
    if (segment === undefined) {
      return;
    }
    const namespace = target.provider.getNamespace();
    const clsContext = namespace.createContext();
    namespace.enter(clsContext);
    // If segment is defined, then it is a Segment as this middleware is only used for Lambda Handlers
    const lambdaSegment = segment as Segment;
    const handlerSegment = lambdaSegment.addNewSubsegment(
      `## ${process.env._HANDLER}`
    );
    target.setSegment(handlerSegment);
    request.internal = {
      ...request.internal,
      [lambdaSegmentKey]: lambdaSegment,
      [handlerSegmentKey]: handlerSegment,
      [clsContextKey]: clsContext,
    };
  };

  /**
   * Close the handler subsegment for this invocation, restore the facade
   * segment, and exit the invocation's CLS context.
   *
   * @param request - The request object
   */
  const close = (request: MiddyLikeRequest): void => {
    const handlerSegment = request.internal[handlerSegmentKey] as
      | Subsegment
      | undefined;
    const lambdaSegment = request.internal[lambdaSegmentKey] as
      | Segment
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
    const clsContext = request.internal[clsContextKey];
    if (clsContext !== undefined) {
      target.provider.getNamespace().exit(clsContext);
    }
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
