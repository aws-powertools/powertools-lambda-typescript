import { populateEnvironmentVariables } from '../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Metrics, MetricUnits } from '../src';

const metrics = new Metrics();

const lambdaHandler: Handler = async () => {

  metrics.addMetric('test-metric', MetricUnits.Count, 10);
  metrics.purgeStoredMetrics();
  //Metrics will be logged and cleared

  return {
    foo: 'bar'
  };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));