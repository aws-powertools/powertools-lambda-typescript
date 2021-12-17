import { Metrics, MetricUnits } from '../../src';


const namespace = 'CDKExample';
const serviceName = 'MyFunctionWithStandardHandler';

const metrics = new Metrics({ namespace: namespace, service: serviceName });

export const handler = async (event: any, context: any) => {
  metrics.captureColdStartMetric();
  metrics.raiseOnEmptyMetrics();
  metrics.setDefaultDimensions({ environment: 'example', type: 'standardFunction' });
  metrics.addMetric('test-metric', MetricUnits.Count, 10);

  const metricWithItsOwnDimensions = metrics.singleMetric();
  metricWithItsOwnDimensions.addDimension('InnerDimension', 'true');
  metricWithItsOwnDimensions.addMetric('single-metric', MetricUnits.Percent, 50);

  metrics.purgeStoredMetrics();
  metrics.raiseOnEmptyMetrics();
};
