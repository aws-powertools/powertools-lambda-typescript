import { Metrics } from '@aws-lambda-powertools/metrics';
import { defaultValues, metricsNamespace, serviceName } from './constants.js';

/**
 * Create metrics instance with centralized configuration so that
 * all functions have the same dimensions and namespace.
 */
const metrics = new Metrics({
  serviceName,
  namespace: metricsNamespace,
  defaultDimensions: defaultValues,
});

export { metrics };
