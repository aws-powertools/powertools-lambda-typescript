import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { populateEnvironmentVariables } from '../tests/helpers';
import { Metrics } from '../src';
import middy from '@middy/core';
import { logMetrics } from '../src';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

const metrics = new Metrics();

const lambdaHandler = async (): Promise<void> => {
  // Notice that no metrics are added
  // Since the throwOnEmptyMetrics parameter is set to true, the Powertool throws an Error
};

const handlerWithMiddleware = middy(lambdaHandler)
  .use(logMetrics(metrics, { throwOnEmptyMetrics: true }));

handlerWithMiddleware(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));