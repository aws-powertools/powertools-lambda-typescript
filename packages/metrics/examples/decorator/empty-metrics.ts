import { populateEnvironmentVariables } from '../../tests/helpers';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { LambdaInterface } from './utils/lambda/LambdaInterface';
import { Callback, Context } from 'aws-lambda/handler';
import { Metrics } from '../src';

const metrics = new Metrics();

class Lambda implements LambdaInterface {

  // Be default, we will not throw any error if there is no metrics. Use this property to override and throw an exception
  @metrics.logMetrics({ throwOnEmptyMetrics: true })
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    // Notice that no metrics are added
    // Since the throwOnEmptyMetrics parameter is set to true, the Powertool throws an Error
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));