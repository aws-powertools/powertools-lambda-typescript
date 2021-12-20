import { Metrics, MetricUnits } from '../../src';

const namespace = process.env.EXPECTED_NAMESPACE ?? 'CDKExample';
const serviceName = process.env.EXPECTED_SERVICE_NAME ?? 'MyFunctionWithStandardHandler';
const metricName = process.env.EXPECTED_METRIC_NAME ?? 'MyMetric';
const metricUnit = (process.env.EXPECTED_METRIC_UNIT as MetricUnits) ?? MetricUnits.Count;
const metricValue = process.env.EXPECTED_METRIC_VALUE ?? 1;
const defaultDimensions = process.env.EXPECTED_DEFAULT_DIMENSIONS ?? '{"MyDimension":"MyValue"}';
const extraDimension = process.env.EXPECTED_EXTRA_DIMENSION ?? '{"MyExtraDimension":"MyExtraValue"}';
const singleMetricDimension = process.env.EXPECTED_SINGLE_METRIC_DIMENSION ?? '{"MySingleMetricDim":"MySingleValue"}';
const singleMetricName = process.env.EXPECTED_SINGLE_METRIC_NAME ?? 'MySingleMetric';
const singleMetricUnit = (process.env.EXPECTED_SINGLE_METRIC_UNIT as MetricUnits) ?? MetricUnits.Percent;
const singleMetricValue = process.env.EXPECTED_SINGLE_METRIC_VALUE ?? 2;

const metrics = new Metrics({ namespace: namespace, service: serviceName });

export const handler = async (event: any, context: any) => {
  metrics.captureColdStartMetric();
  metrics.raiseOnEmptyMetrics();
  metrics.setDefaultDimensions(JSON.parse(defaultDimensions));
  metrics.addMetric(metricName, metricUnit, metricValue as number);
  metrics.addDimension(
    Object.entries(JSON.parse(extraDimension))[0][0],
    Object.entries(JSON.parse(extraDimension))[0][1] as string,
  );

  const metricWithItsOwnDimensions = metrics.singleMetric();
  metricWithItsOwnDimensions.addDimension(
    Object.entries(JSON.parse(singleMetricDimension))[0][0],
    Object.entries(JSON.parse(singleMetricDimension))[0][1] as string,
  );
  metricWithItsOwnDimensions.addMetric(singleMetricName, singleMetricUnit, singleMetricValue as number);

  metrics.purgeStoredMetrics();
  metrics.raiseOnEmptyMetrics();
};
