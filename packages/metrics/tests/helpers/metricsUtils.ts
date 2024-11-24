import {
  type CloudWatchClient,
  type Dimension,
  ListMetricsCommand,
  type ListMetricsCommandOutput,
} from '@aws-sdk/client-cloudwatch';
import promiseRetry from 'promise-retry';

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

const sortDimensions = (dimensions?: Dimension[]): Dimension[] | undefined =>
  dimensions?.sort((a, b) => (a.Name || '').localeCompare(b?.Name || ''));

export { getMetrics, sortDimensions };
