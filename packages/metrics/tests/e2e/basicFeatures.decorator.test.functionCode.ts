import { Metrics, MetricUnits } from '../../src/index.js';
import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';

const namespace = process.env.EXPECTED_NAMESPACE ?? 'CdkExample';
const serviceName =
  process.env.EXPECTED_SERVICE_NAME ?? 'MyFunctionWithStandardHandler';
const metricName = process.env.EXPECTED_METRIC_NAME ?? 'MyMetric';
const metricUnit =
  (process.env.EXPECTED_METRIC_UNIT as MetricUnits) ?? MetricUnits.Count;
const metricValue = process.env.EXPECTED_METRIC_VALUE ?? '1';
const defaultDimensions =
  process.env.EXPECTED_DEFAULT_DIMENSIONS ?? '{"MyDimension":"MyValue"}';
const extraDimension =
  process.env.EXPECTED_EXTRA_DIMENSION ?? '{"MyExtraDimension":"MyExtraValue"}';
const singleMetricDimension =
  process.env.EXPECTED_SINGLE_METRIC_DIMENSION ??
  '{"MySingleMetricDim":"MySingleValue"}';
const singleMetricName =
  process.env.EXPECTED_SINGLE_METRIC_NAME ?? 'MySingleMetric';
const singleMetricUnit =
  (process.env.EXPECTED_SINGLE_METRIC_UNIT as MetricUnits) ??
  MetricUnits.Percent;
const singleMetricValue = process.env.EXPECTED_SINGLE_METRIC_VALUE ?? '2';

const metrics = new Metrics({ namespace: namespace, serviceName: serviceName });

class Lambda implements LambdaInterface {
  @metrics.logMetrics({
    captureColdStartMetric: true,
    defaultDimensions: JSON.parse(defaultDimensions),
    throwOnEmptyMetrics: true,
  })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public async handler(_event: unknown, _context: Context): Promise<void> {
    metrics.addMetric(metricName, metricUnit, parseInt(metricValue));
    metrics.addDimension(
      Object.entries(JSON.parse(extraDimension))[0][0],
      Object.entries(JSON.parse(extraDimension))[0][1] as string
    );

    this.dummyMethod();
  }

  private dummyMethod(): void {
    const metricWithItsOwnDimensions = metrics.singleMetric();
    metricWithItsOwnDimensions.addDimension(
      Object.entries(JSON.parse(singleMetricDimension))[0][0],
      Object.entries(JSON.parse(singleMetricDimension))[0][1] as string
    );

    metricWithItsOwnDimensions.addMetric(
      singleMetricName,
      singleMetricUnit,
      parseInt(singleMetricValue)
    );
  }
}

const handlerClass = new Lambda();
export const handler = handlerClass.handler.bind(handlerClass);
