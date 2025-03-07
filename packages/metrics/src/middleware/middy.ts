import { METRICS_KEY } from '@aws-lambda-powertools/commons';
import type {
  MiddlewareLikeObj,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import type { Metrics } from '../Metrics.js';
import type { ExtraOptions } from '../types/Metrics.js';

/**
 * A Middy.js middleware automating capture of Amazon CloudWatch metrics.
 *
 * This middleware is compatible with `@middy/core@3.x` and above.
 *
 * The middleware automatically flushes metrics after the handler function returns or throws an error,
 * so you don't need to call {@link Metrics.publishStoredMetrics | `publishStoredMetrics()`} manually.
 *
 * @example
 * ```typescript
 * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
 * import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
 * import middy from '@middy/core';
 *
 * const metrics = new Metrics({
 *   namespace: 'serverlessAirline',
 *   serviceName: 'orders'
 * });
 *
 * export const handler = middy(async () => {
 *   metrics.addMetadata('request_id', event.requestId);
 *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
 * }).use(logMetrics(metrics, {
 *   captureColdStartMetric: true,
 *   throwOnEmptyMetrics: true,
 * }));
 * ```
 *
 * You can configure the middleware with the following options:
 * - `captureColdStartMetric`: Whether to capture a `ColdStart` metric
 * - `defaultDimensions`: Default dimensions to add to all metrics
 * - `throwOnEmptyMetrics`: Whether to throw an error if no metrics are emitted
 *
 * @param target - The Metrics instance to use for emitting metrics
 * @param options - Options to configure the middleware, see {@link ExtraOptions}
 */
const logMetrics = (
  target: Metrics | Metrics[],
  options: ExtraOptions = {}
): MiddlewareLikeObj => {
  const metricsInstances = Array.isArray(target) ? target : [target];

  /**
   * Set the cleanup function to be called in case other middlewares return early.
   *
   * @param request - The request object
   */
  const setCleanupFunction = (request: MiddyLikeRequest): void => {
    request.internal = {
      ...request.internal,
      [METRICS_KEY]: logMetricsAfterOrError,
    };
  };

  const logMetricsBefore = async (request: MiddyLikeRequest): Promise<void> => {
    for (const metrics of metricsInstances) {
      const {
        throwOnEmptyMetrics,
        defaultDimensions,
        captureColdStartMetric,
        functionName,
      } = options;
      if (!metrics.hasFunctionName() || functionName) {
        metrics.setFunctionName(functionName ?? request.context.functionName);
      }
      if (throwOnEmptyMetrics) {
        metrics.setThrowOnEmptyMetrics(throwOnEmptyMetrics);
      }
      if (defaultDimensions !== undefined) {
        metrics.setDefaultDimensions(defaultDimensions);
      }
      if (captureColdStartMetric) {
        metrics.captureColdStartMetric();
      }
    }

    setCleanupFunction(request);
  };

  const logMetricsAfterOrError = async (): Promise<void> => {
    for (const metrics of metricsInstances) {
      metrics.publishStoredMetrics();
    }
  };

  return {
    before: logMetricsBefore,
    after: logMetricsAfterOrError,
    onError: logMetricsAfterOrError,
  };
};

export { logMetrics };
