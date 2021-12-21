import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { populateEnvironmentVariables } from '../tests/helpers';
import { Metrics } from '../src';
import middy from '@middy/core';
import { logMetrics } from '../src/middleware/middy';

// Populate runtime
populateEnvironmentVariables();
// Additional runtime variables
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';

const metrics = new Metrics();

const lambdaHandler = async (): Promise<void> => {
  // No metric added
};

const handlerWithMiddleware = middy(lambdaHandler)
  .use(logMetrics(metrics, { raiseOnEmptyMetrics: true }));

handlerWithMiddleware(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));