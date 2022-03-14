import { CloudWatch } from 'aws-sdk';
import promiseRetry from 'promise-retry';

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

export { getMetrics };