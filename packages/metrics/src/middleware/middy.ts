import { METRICS_KEY } from '@aws-lambda-powertools/commons';
import type {
  MiddlewareLikeObj,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import type { Metrics } from '../Metrics.js';
import type { ExtraOptions } from '../types/Metrics.js';

/**
 * A middy middleware automating capture of metadata and annotations on segments or subsegments for a Lambda Handler.
 *
 * Using this middleware on your handler function will automatically flush metrics after the function returns or throws an error.
 * Additionally, you can configure the middleware to easily:
 * * ensure that at least one metric is emitted before you flush them
 * * capture a `ColdStart` a metric
 * * set default dimensions for all your metrics
 *
 * @example
 * ```typescript
 * import { Metrics } from '@aws-lambda-powertools/metrics';
 * import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
 * import middy from '@middy/core';
 *
 * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
 *
 * const lambdaHandler = async (_event: any, _context: any) => {
 *   ...
 * };
 *
 * export const handler = middy(lambdaHandler).use(logMetrics(metrics));
 * ```
 *
 * @param target - The Metrics instance to use for emitting metrics
 * @param options - (_optional_) Options for the middleware
 * @returns middleware - The middy middleware object
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
      metrics.setFunctionName(request.context.functionName);
      const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } =
        options;
      if (throwOnEmptyMetrics) {
        metrics.throwOnEmptyMetrics();
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
