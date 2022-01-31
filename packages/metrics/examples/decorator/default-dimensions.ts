import { populateEnvironmentVariables } from '../../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
import { LambdaInterface } from '../utils/lambda';
import { Callback, Context } from 'aws-lambda/handler';
import { Metrics, MetricUnits } from '../../src';

const metrics = new Metrics();

class Lambda implements LambdaInterface {

  @metrics.logMetrics({ defaultDimensions:{ 'application': 'hello-world' } })
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    metrics.addDimension('environment', 'dev');
    metrics.addDimension('application', 'hello-world-dev');
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
    // You can override the default dimensions by clearing the existing metrics first. Note that the cleared metric will be dropped, it will NOT be published to CloudWatch 
    const metricsObject = metrics.serializeMetrics();
    metrics.clearMetrics();
    metrics.clearDimensions();
    metrics.addMetric('new-test-metric', MetricUnits.Count, 5);
    console.log(JSON.stringify(metricsObject));
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));