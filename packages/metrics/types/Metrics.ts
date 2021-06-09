import { ConfigServiceInterface } from '../src/config';
import { MetricUnit } from './MetricUnit';

type MetricsOptions = {
  customConfigService?: ConfigServiceInterface
  namespace?: string
  service?: string
};

type EmfOutput = {
  [key: string]: string | number | {
    Timestamp: number
    CloudWatchMetrics: {
      Namespace: string
      Dimensions: [string[] | undefined]
      Metrics: { Name: string; Unit:MetricUnit }[]
    }[]
  }
};

export {
  EmfOutput,
  MetricsOptions
};