import type { Metrics } from '@aws-lambda-powertools/metrics';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import type { Middleware, RequestContext } from '../../types/http.js';
import { HttpError } from '../errors.js';

const getHeaderMetadata = (req: Request): Record<string, string> => {
  const metadata: Record<string, string> = {};

  const xForwardedFor = req.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    metadata.ipAddress = xForwardedFor.split(',')[0].trim();
  }
  const userAgent = req.headers.get('User-Agent');
  if (userAgent) {
    metadata.userAgent = userAgent;
  }

  return metadata;
};

const getEventMetadata = (reqCtx: RequestContext): Record<string, string> => {
  const metadata: Record<string, string> = {};

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
 * - Adds the matched route as a metric dimension
 * - Emits `latency` (Milliseconds), `fault` (Count), and `error` (Count) metrics
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
      const metadata = {
        ...getHeaderMetadata(reqCtx.req),
        ...getEventMetadata(reqCtx),
      };
      for (const [key, value] of Object.entries(metadata)) {
        metrics.addMetadata(key, value);
      }
      metrics
        .addDimension('route', reqCtx.route)
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
