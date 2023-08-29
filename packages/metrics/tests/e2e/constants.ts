import { MetricUnits } from '../../src';

const RESOURCE_NAME_PREFIX = 'Metrics-E2E';
const ONE_MINUTE = 60 * 1000;
const TEST_CASE_TIMEOUT = 3 * ONE_MINUTE;
const SETUP_TIMEOUT = 5 * ONE_MINUTE;
const TEARDOWN_TIMEOUT = 5 * ONE_MINUTE;

const expectedMetricName = 'MyMetric';
const expectedMetricUnit = MetricUnits.Count;
const expectedMetricValue = '1';
const expectedDefaultDimensions = { MyDimension: 'MyValue' };
const expectedExtraDimension = { MyExtraDimension: 'MyExtraValue' };
const expectedSingleMetricDimension = { MySingleMetricDim: 'MySingleValue' };
const expectedSingleMetricName = 'MySingleMetric';
const expectedSingleMetricUnit = MetricUnits.Percent;
const expectedSingleMetricValue = '2';
const commonEnvironmentVariables = {
  EXPECTED_METRIC_NAME: expectedMetricName,
  EXPECTED_METRIC_UNIT: expectedMetricUnit,
  EXPECTED_METRIC_VALUE: expectedMetricValue,
  EXPECTED_DEFAULT_DIMENSIONS: JSON.stringify(expectedDefaultDimensions),
  EXPECTED_EXTRA_DIMENSION: JSON.stringify(expectedExtraDimension),
  EXPECTED_SINGLE_METRIC_DIMENSION: JSON.stringify(
    expectedSingleMetricDimension
  ),
  EXPECTED_SINGLE_METRIC_NAME: expectedSingleMetricName,
  EXPECTED_SINGLE_METRIC_UNIT: expectedSingleMetricUnit,
  EXPECTED_SINGLE_METRIC_VALUE: expectedSingleMetricValue,
};

export {
  RESOURCE_NAME_PREFIX,
  ONE_MINUTE,
  TEST_CASE_TIMEOUT,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  expectedMetricName,
  expectedMetricUnit,
  expectedMetricValue,
  expectedDefaultDimensions,
  expectedExtraDimension,
  expectedSingleMetricDimension,
  expectedSingleMetricName,
  expectedSingleMetricUnit,
  expectedSingleMetricValue,
  commonEnvironmentVariables,
};
