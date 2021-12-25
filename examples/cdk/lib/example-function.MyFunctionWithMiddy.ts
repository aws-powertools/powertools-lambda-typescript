import middy from '@middy/core';
import { Callback, Context } from 'aws-lambda';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({ namespace: 'CDKExample', service: 'withMiddy' }); // Sets metric namespace, and service as a metric dimension

type CustomEvent = {
  throw: boolean
};

class MyFunctionWithDecorator {

  @metrics.logMetrics({ captureColdStartMetric: true })
  public handler(_event: CustomEvent, _context: Context, _callback: Callback<unknown>): void | Promise<unknown> {
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
    if (_event.throw) {
      throw new Error('Test error');
    }
  }
}

const handler = middy(async (_event, _context) => {

  const handlerClass = new MyFunctionWithDecorator();

  return handlerClass.handler(_event, _context, () => console.log('Lambda invoked!'));
});

handler.before(async (_request) => {
  metrics.addMetric('beforeHandlerCalled', MetricUnits.Count, 1);
});

handler.after(async (_request) => {
  // Won't be flushed since happens after 
  metrics.addMetric('afterHandlerCalled', MetricUnits.Count, 1);

});

handler.onError(async (_request) => {
  metrics.addMetric('onErrorHandlerCalled', MetricUnits.Count, 1);
});

module.exports = { handler };