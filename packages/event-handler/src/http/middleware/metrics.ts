import type { Metrics } from '@aws-lambda-powertools/metrics';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import type { Middleware, RequestContext } from '../../types/http.js';
import { HttpError } from '../errors.js';

const getHeaderMetadata = (req: Request): Record<string, string> => {
  const metadata: Record<string, string> = {};

  const userAgent = req.headers.get('User-Agent');
  if (userAgent) {
    metadata.userAgent = userAgent;
  }

  return metadata;
};

const getIpAddress = (reqCtx: RequestContext): string | undefined => {
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

const getEventMetadata = (reqCtx: RequestContext): Record<string, string> => {
  const metadata: Record<string, string> = {};

  const ipAddress = getIpAddress(reqCtx);
  if (ipAddress) {
    metadata.ipAddress = ipAddress;
  }

  if (reqCtx.responseType !== 'ALB') {
    metadata.apiGwRequestId = reqCtx.event.requestContext.requestId;
    metadata.apiGwApiId = reqCtx.event.requestContext.apiId;
  }
  if (reqCtx.responseType === 'ApiGatewayV1') {
    const extendedRequestId = reqCtx.event.requestContext.extendedRequestId;
    if (extendedRequestId) {
      metadata.apiGwExtendedRequestId = extendedRequestId;
    }
  }

  return metadata;
};

/**
 * A middleware for emitting per-request metrics using Powertools Metrics.
 *
 * This middleware automatically:
 * - Adds the matched route as a metric dimension (uses `NOT_FOUND` when no route matches to prevent dimension explosion)
 * - Emits `latency` (Milliseconds), `fault` (Count), and `error` (Count) metrics
 * - Adds `httpMethod` and `path` metadata for all requests
 * - Adds `ipAddress` and `userAgent` metadata from request headers when available
 * - Adds `apiGwRequestId` and `apiGwApiId` metadata for API Gateway V1 and V2 events
 * - Adds `apiGwExtendedRequestId` metadata for API Gateway V1 events when available
 * - Publishes stored metrics after each request
 *
 * @example
 * ```typescript
 * import { Router } from '@aws-lambda-powertools/event-handler/http';
 * import { metrics as metricsMiddleware } from '@aws-lambda-powertools/event-handler/http/middleware/metrics';
 * import { Metrics } from '@aws-lambda-powertools/metrics';
 *
 * const metrics = new Metrics({ namespace: 'my-app', serviceName: 'my-service' });
 * const app = new Router();
 *
 * app.use(metricsMiddleware(metrics));
 * ```
 *
 * @param metrics - The Metrics instance to use for emitting metrics
 */
const metrics = (metrics: Metrics): Middleware => {
  return async ({ reqCtx, next }) => {
    const start = performance.now();
    let status = 500;

    try {
      await next();
      status = reqCtx.res.status;
    } catch (error) {
      status = error instanceof HttpError ? error.statusCode : 500;
      throw error;
    } finally {
      const url = new URL(reqCtx.req.url);
      const metadata = {
        httpMethod: reqCtx.req.method,
        path: url.pathname,
        statusCode: String(status),
        ...getHeaderMetadata(reqCtx.req),
        ...getEventMetadata(reqCtx),
      };
      for (const [key, value] of Object.entries(metadata)) {
        metrics.addMetadata(key, value);
      }
      metrics
        .addDimension('route', reqCtx.route ?? 'NOT_FOUND')
        .addMetric(
          'latency',
          MetricUnit.Milliseconds,
          performance.now() - start
        )
        .addMetric('fault', MetricUnit.Count, status >= 500 ? 1 : 0)
        .addMetric(
          'error',
          MetricUnit.Count,
          status >= 400 && status < 500 ? 1 : 0
        )
        .publishStoredMetrics();
    }
  };
};

export { metrics };
