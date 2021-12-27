import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { populateEnvironmentVariables } from '../tests/helpers';
import { Metrics, MetricUnits } from '../src';
import middy from '@middy/core';
import { logMetrics } from '../src/middleware/middy';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

const metrics = new Metrics();

const lambdaHandler = async (): Promise<void> => {
  metrics.addDimension('metricUnit', 'milliseconds');
  // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
  metrics.addMetric('latency', MetricUnits.Milliseconds, 56);

  const singleMetric = metrics.singleMetric();
  // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
  singleMetric.addDimension('metricType', 'business');
  singleMetric.addMetric('videoClicked', MetricUnits.Count, 1);
};

const handlerWithMiddleware = middy(lambdaHandler)
  .use(logMetrics(metrics));

handlerWithMiddleware(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));