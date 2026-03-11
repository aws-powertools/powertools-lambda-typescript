import type { Metrics } from '@aws-lambda-powertools/metrics';
import { MetricUnit } from '@aws-lambda-powertools/metrics';
import type { Middleware } from '../../types/http.js';
import { HttpError } from '../errors.js';

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
      metrics.addDimension('route', reqCtx.route);
      metrics.addMetric(
        'latency',
        MetricUnit.Milliseconds,
        performance.now() - start
      );
      metrics.addMetric('fault', MetricUnit.Count, status >= 500 ? 1 : 0);
      metrics.addMetric(
        'error',
        MetricUnit.Count,
        status >= 400 && status < 500 ? 1 : 0
      );
      metrics.publishStoredMetrics();
    }
  };
};

export { metrics };
