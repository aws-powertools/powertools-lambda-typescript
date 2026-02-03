import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { Subsegment } from 'aws-xray-sdk-core';
import type { Middleware, TracerOptions } from '../../types/http.js';

/**
 * A middleware for tracing HTTP routes using AWS X-Ray.
 *
 * This middleware automatically:
 * - Creates a subsegment for each HTTP route
 * - Adds `ColdStart` annotation
 * - Adds service name annotation
 * - Captures the response as metadata (for non-streaming JSON responses)
 * - Captures errors as metadata
 *
 * **Note:** This middleware is completely disabled when the request is in HTTP streaming mode.
 *
 * @example
 * ```typescript
 * import { Router } from '@aws-lambda-powertools/event-handler/http';
 * import { tracer as tracerMiddleware } from '@aws-lambda-powertools/event-handler/http/middleware/tracer';
 * import { Tracer } from '@aws-lambda-powertools/tracer';
 *
 * const tracer = new Tracer({ serviceName: 'my-service' });
 * const app = new Router();
 *
 * // Apply globally
 * app.use(tracerMiddleware(tracer));
 *
 * // Or apply per-route
 * app.get('/users', [tracerMiddleware(tracer)], async ({ reqCtx }) => {
 *   return { users: [] };
 * });
 * ```
 *
 * @param tracer - The Tracer instance to use for tracing
 * @param options - Optional configuration for the middleware
 */
const tracer = (tracer: Tracer, options?: TracerOptions): Middleware => {
  const {
    captureResponse = true,
    logger = {
      warn: console.warn,
    },
  } = options ?? {};

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
          logger.warn(
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

export { tracer };
