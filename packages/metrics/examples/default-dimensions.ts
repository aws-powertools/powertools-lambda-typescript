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
  metrics.addDimension('environment', 'dev');
  metrics.addDimension('application', 'hello-world-dev');
  metrics.addMetric('test-metric', MetricUnits.Count, 10);
  metrics.addMetric('new-test-metric-with-dimensions', MetricUnits.Count, 5);
  metrics.addMetric('new-test-metric-without-dimensions', MetricUnits.Count, 5);

  // Optional: clear metrics and dimensions created till now
  // metrics.clearMetrics();
  // metrics.clearDimensions();

};

const handlerWithMiddleware = middy(lambdaHandler)
  .use(logMetrics(metrics, { defaultDimensions:{ 'application': 'hello-world' } }));

handlerWithMiddleware(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
