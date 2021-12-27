import { populateEnvironmentVariables } from '../../tests/helpers';
import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
import { LambdaInterface } from './../utils/lambda/LambdaInterface';
import { Callback, Context } from 'aws-lambda/handler';
import { Metrics, MetricUnits } from '../../src';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

const metrics = new Metrics();

class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addDimension('metricUnit', 'milliseconds');
    // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
    metrics.addMetric('latency', MetricUnits.Milliseconds, 56);

    const singleMetric = metrics.singleMetric();
    // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
    singleMetric.addDimension('metricType', 'business');
    singleMetric.addMetric('videoClicked', MetricUnits.Count, 1);
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));