import type { Metrics } from '../Metrics';
import type middy from '@middy/core';
import type { ExtraOptions } from '../types';

const logMetrics = (target: Metrics | Metrics[], options: ExtraOptions = {}): middy.MiddlewareObj => {
  const metricsInstances = target instanceof Array ? target : [target];

  const logMetricsBefore = async (request: middy.Request): Promise<void> => {
    metricsInstances.forEach((metrics: Metrics) => {
      metrics.setFunctionName(request.context.functionName);
      const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } = options;
      if (throwOnEmptyMetrics !== undefined) {
        metrics.throwOnEmptyMetrics();
      }
      if (defaultDimensions !== undefined) {
        metrics.setDefaultDimensions(defaultDimensions);
      }
      if (captureColdStartMetric !== undefined) {
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