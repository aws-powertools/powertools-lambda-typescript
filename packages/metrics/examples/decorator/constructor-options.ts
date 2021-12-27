import * as dummyEvent from '../../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../../tests/resources/contexts/hello-world';
import { Metrics, MetricUnits } from '../../src';
import { LambdaInterface } from './../utils/lambda';
import { Callback, Context } from 'aws-lambda/handler';

const metrics = new Metrics({
  namespace: 'hello-world-constructor',
  service: 'hello-world-service-constructor'
});

class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addMetric('test-metric', MetricUnits.Count, 10);

  }

}
new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));