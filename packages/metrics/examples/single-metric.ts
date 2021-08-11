import { populateEnvironmentVariables } from '../tests/helpers';
import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { LambdaInterface } from './utils/lambda/LambdaInterface';
import { Callback, Context } from 'aws-lambda/handler';
import { Metrics, MetricUnits } from '../src';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

const metrics = new Metrics();

class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    const singleMetric = metrics.singleMetric();
    metrics.addDimension('OuterDimension', 'true');
    singleMetric.addDimension('InnerDimension', 'true');
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
    singleMetric.addMetric('single-metric', MetricUnits.Percent, 50);
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));