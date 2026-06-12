import type { Context } from 'aws-lambda';
import { Metrics, MetricUnit } from '../../src/index.js';
import type { MetricUnit as MetricUnitType } from '../../src/types/index.js';

const namespace = process.env.EXPECTED_NAMESPACE ?? 'CdkExample';
const serviceName =
  process.env.EXPECTED_SERVICE_NAME ?? 'MyFunctionWithStandardHandler';
const metricName = process.env.EXPECTED_METRIC_NAME ?? 'MyMetric';
const metricUnit =
  (process.env.EXPECTED_METRIC_UNIT as MetricUnitType) ?? MetricUnit.Count;
const metricValue = process.env.EXPECTED_METRIC_VALUE ?? '1';
const defaultDimensions =
  process.env.EXPECTED_DEFAULT_DIMENSIONS ?? '{"MyDimension":"MyValue"}';

const metrics = new Metrics({ namespace: namespace, serviceName: serviceName });

export const handler = (_event: unknown, _context: Context) => {
  // The metrics are automatically flushed via `[Symbol.dispose]()` when the
  // `using` binding leaves the handler scope, even if an error is thrown.
  using _ = metrics;

  metrics.captureColdStartMetric();
  metrics.setDefaultDimensions(JSON.parse(defaultDimensions));
  metrics.addMetric(metricName, metricUnit, Number.parseInt(metricValue, 10));
};
