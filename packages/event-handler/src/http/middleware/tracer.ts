import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { Subsegment } from 'aws-xray-sdk-core';
import type {
  Middleware,
  RequestContext,
  TracerOptions,
} from '../../types/http.js';
import type { compress } from './compress.js';

/**
 * The shape of the `http` field added to an X-Ray (sub)segment.
 *
 * This mirrors the structure produced by the X-Ray SDK's `IncomingRequestData`,
 * but the SDK does not expose a type for it, so we declare it locally.
 *
 * @see {@link https://github.com/aws/aws-xray-sdk-node/blob/master/packages/core/lib/middleware/incoming_request_data.js}
 */
type SegmentHttpData = {
  request: {
    method: string;
    url: string;
    user_agent?: string;
    client_ip?: string;
    x_forwarded_for?: boolean;
  };
  response?: {
    status: number;
    content_length?: number;
  };
};

/**
 * Extracts the client IP address from the request context.
 *
 * For API Gateway events the source IP is taken from the request context, while
 * for ALB (or any other source) it falls back to the `X-Forwarded-For` header.
 *
 * @param reqCtx - The request context for the current request
 */
const getClientIp = (reqCtx: RequestContext): string | undefined => {
  if (reqCtx.responseType === 'ApiGatewayV1') {
    return reqCtx.event.requestContext.identity.sourceIp;
  }
  if (reqCtx.responseType === 'ApiGatewayV2') {
    return reqCtx.event.requestContext.http.sourceIp;
  }
  const xForwardedFor = reqCtx.req.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return undefined;
};

/**
 * Builds the `http.request` data for the X-Ray subsegment from the request context.
 *
 * @param reqCtx - The request context for the current request
 * @param url - The parsed request URL
 */
const getRequestData = (
  reqCtx: RequestContext,
  url: URL
): SegmentHttpData['request'] => {
  const request: SegmentHttpData['request'] = {
    method: reqCtx.req.method,
    url: `${url.origin}${url.pathname}`,
  };

  const userAgent = reqCtx.req.headers.get('User-Agent');
  if (userAgent) {
    request.user_agent = userAgent;
  }

  const clientIp = getClientIp(reqCtx);
  if (clientIp) {
    request.client_ip = clientIp;
  }

  if (reqCtx.req.headers.has('X-Forwarded-For')) {
    request.x_forwarded_for = true;
  }

  return request;
};

/**
 * Builds the `http.response` data for the X-Ray subsegment from the response.
 *
 * The `content_length` field is only populated when the response carries a
 * `Content-Length` header. The framework does not set this header by default,
 * so it is only present if your handler sets it explicitly or you use the
 * {@link compress | `compress`} middleware. In the latter case, `compress` must
 * run as an inner middleware relative to this one (i.e. registered after it) so
 * that the header is set before this middleware reads it.
 *
 * @param res - The response for the current request
 */
const getResponseData = (res: Response): SegmentHttpData['response'] => {
  const response: SegmentHttpData['response'] = {
    status: res.status,
  };

  const contentLength = res.headers.get('Content-Length');
  if (contentLength) {
    const parsed = Number.parseInt(contentLength, 10);
    if (!Number.isNaN(parsed)) {
      response.content_length = parsed;
    }
  }

  return response;
};

/**
 * A middleware for tracing HTTP routes using AWS X-Ray.
 *
 * This middleware automatically:
 * - Creates a subsegment for each HTTP route
 * - Adds `ColdStart` annotation
 * - Adds service name annotation
 * - Populates the `http` field of the subsegment with request/response data
 *   (method, url, user agent, client IP, status code, and content length)
 * - Captures the response as metadata (for non-streaming JSON responses)
 * - Captures errors as metadata
 *
 * **Note:** The `http` request/response data is attached to the route subsegment
 * rather than the Lambda function segment. Because of this, the CloudWatch Traces
 * UI will not populate the top-level **HTTP Method** and **URL Address** fields, but
 * the data is available in the "Raw data" and single-trace views.
 *
 * **Note:** The `http.response.content_length` field is only populated when the
 * response has a `Content-Length` header. If you use the {@link compress | `compress`}
 * middleware to set this header, register it as an inner middleware relative to this
 * one (i.e. after it) so the header is set before this middleware reads the response.
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

      // The `http` field is not part of the public `Subsegment` type, but the
      // X-Ray SDK reads it when serializing the segment. See `SegmentHttpData`.
      (subSegment as Subsegment & { http: SegmentHttpData }).http = {
        request: getRequestData(reqCtx, url),
      };
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
        (subSegment as Subsegment & { http: SegmentHttpData }).http.response =
          getResponseData(reqCtx.res);
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
