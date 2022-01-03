import type { Metrics } from '../Metrics';
import middy from '@middy/core';
import { ExtraOptions } from '../types';

const logMetrics = (target: Metrics | Metrics[], options: ExtraOptions = {}): middy.MiddlewareObj => {
  const metricsInstances = target instanceof Array ? target : [target];

  const logMetricsBefore = async (request: middy.Request): Promise<void> => {
    metricsInstances.forEach((metrics: Metrics) => {
      metrics.setFunctionName(request.context.functionName);
      const { raiseOnEmptyMetrics, defaultDimensions, captureColdStartMetric } = options;
      if (raiseOnEmptyMetrics !== undefined) {
        metrics.raiseOnEmptyMetrics();
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