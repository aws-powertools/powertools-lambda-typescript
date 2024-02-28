import { randomUUID } from 'node:crypto';
import { MetricUnit } from '../../src/index.js';

const RESOURCE_NAME_PREFIX = 'Metrics';
const ONE_MINUTE = 60 * 1000;
const TEST_CASE_TIMEOUT = 3 * ONE_MINUTE;
const SETUP_TIMEOUT = 7 * ONE_MINUTE;
const TEARDOWN_TIMEOUT = 5 * ONE_MINUTE;

const commonEnvironmentVars = {
  EXPECTED_METRIC_NAME: 'MyMetric',
  EXPECTED_METRIC_UNIT: MetricUnit.Count,
  EXPECTED_METRIC_VALUE: '1',
  EXPECTED_NAMESPACE: randomUUID(),
  EXPECTED_DEFAULT_DIMENSIONS: { MyDimension: 'MyValue' },
  EXPECTED_EXTRA_DIMENSION: { MyExtraDimension: 'MyExtraValue' },
  EXPECTED_SINGLE_METRIC_DIMENSION: { MySingleMetricDim: 'MySingleValue' },
  EXPECTED_SINGLE_METRIC_NAME: 'MySingleMetric',
  EXPECTED_SINGLE_METRIC_UNIT: MetricUnit.Percent,
  EXPECTED_SINGLE_METRIC_VALUE: '2',
  POWERTOOLS_SERVICE_NAME: 'metrics-e2e-testing',
};

export {
  RESOURCE_NAME_PREFIX,
  ONE_MINUTE,
  TEST_CASE_TIMEOUT,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  commonEnvironmentVars,
};
