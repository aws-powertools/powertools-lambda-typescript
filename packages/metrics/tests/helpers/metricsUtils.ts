import promiseRetry from 'promise-retry';
import { Metrics, MetricUnit } from '../../src/index.js';
import { ExtraOptions } from '../../src/types/index.js';
import {
  CloudWatchClient,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import type {
  Dimension,
  ListMetricsCommandOutput,
} from '@aws-sdk/client-cloudwatch';
import type { Context, Handler } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';

const getMetrics = async (
  cloudWatchClient: CloudWatchClient,
  namespace: string,
  metric: string,
  expectedMetrics: number
): Promise<ListMetricsCommandOutput> => {
  const retryOptions = {
    retries: 20,
    minTimeout: 5_000,
    maxTimeout: 10_000,
    factor: 1.25,
  };

  return promiseRetry(async (retry: (err?: Error) => never, _: number) => {
    const result = await cloudWatchClient.send(
      new ListMetricsCommand({
        Namespace: namespace,
        MetricName: metric,
      })
    );

    if (result.Metrics?.length !== expectedMetrics) {
      retry(
        new Error(
          `Expected ${expectedMetrics} metrics, got ${result.Metrics?.length} for ${namespace}.${metric}`
        )
      );
    }

    return result;
  }, retryOptions);
};

const setupDecoratorLambdaHandler = (
  metrics: Metrics,
  options: ExtraOptions = {}
): Handler => {
  class LambdaFunction implements LambdaInterface {
    @metrics.logMetrics(options)
    public async handler<TEvent>(
      _event: TEvent,
      _context: Context
    ): Promise<string> {
      metrics.addMetric('decorator-lambda-test-metric', MetricUnit.Count, 1);

      return 'Lambda invoked!';
    }
  }

  const handlerClass = new LambdaFunction();
  const handler = handlerClass.handler.bind(handlerClass);

  return handler;
};

const sortDimensions = (dimensions?: Dimension[]): Dimension[] | undefined =>
  dimensions?.sort((a, b) => (a.Name || '').localeCompare(b?.Name || ''));

export { getMetrics, setupDecoratorLambdaHandler, sortDimensions };
