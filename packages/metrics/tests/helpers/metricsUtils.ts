import { CloudWatch } from 'aws-sdk';
import promiseRetry from 'promise-retry';
import { Metrics } from '../../src';
import { ExtraOptions, MetricUnits } from '../../src/types';
import { Context, Handler } from 'aws-lambda';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const getMetrics = async (cloudWatchClient: CloudWatch, namespace: string, metric: string, expectedMetrics: number): Promise<CloudWatch.ListMetricsOutput> => {
  const retryOptions = { retries: 20, minTimeout: 5_000, maxTimeout: 10_000, factor: 1.25 };

  return promiseRetry(async (retry: (err?: Error) => never, _: number) => {

    const result = await cloudWatchClient
      .listMetrics({
        Namespace: namespace,
        MetricName: metric,
      })
      .promise();

    if (result.Metrics?.length !== expectedMetrics) {
      retry(new Error(`Expected ${expectedMetrics} metrics, got ${result.Metrics?.length} for ${namespace}.${metric}`));
    }

    return result;
  }, retryOptions);
};

const setupDecoratorLambdaHandler = (metrics: Metrics, options: ExtraOptions = {}): Handler => {
    
  class LambdaFunction implements LambdaInterface {
    @metrics.logMetrics(options)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    public async handler<TEvent>(_event: TEvent, _context: Context): Promise<string> {
      metrics.addMetric('decorator-lambda-test-metric', MetricUnits.Count, 1);
        
      return 'Lambda invoked!';
    }
  }
  
  const handlerClass = new LambdaFunction();
  const handler = handlerClass.handler.bind(handlerClass);
  
  return handler;
};

export {
  getMetrics,
  setupDecoratorLambdaHandler
};

