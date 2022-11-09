import type { Metrics } from '../Metrics';
import type middy from '@middy/core';
import type { ExtraOptions } from '../types';

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
 * import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics';
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
const logMetrics = (target: Metrics | Metrics[], options: ExtraOptions = {}): middy.MiddlewareObj => {
  const metricsInstances = target instanceof Array ? target : [target];

  const logMetricsBefore = async (request: middy.Request): Promise<void> => {
    metricsInstances.forEach((metrics: Metrics) => {
      metrics.setFunctionName(request.context.functionName);
      const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } = options;
      if (throwOnEmptyMetrics) {
        metrics.throwOnEmptyMetrics();
      }
      if (defaultDimensions !== undefined) {
        metrics.setDefaultDimensions(defaultDimensions);
      }
      if (captureColdStartMetric) {
        metrics.captureColdStartMetric();
      }
    });

  };

  const logMetricsAfterOrError = async (): Promise<void> => {
    metricsInstances.forEach((metrics: Metrics) => {
      metrics.publishStoredMetrics();
    });
  };
  
  return {
    before: logMetricsBefore,
    after: logMetricsAfterOrError,
    onError: logMetricsAfterOrError
  };
};

export {
  logMetrics,
};