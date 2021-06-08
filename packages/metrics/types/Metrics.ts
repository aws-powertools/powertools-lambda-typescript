import { ConfigServiceInterface } from '../src/config';
import {MetricUnit} from "./MetricUnit";

type MetricsOptions = {
  customConfigService?: ConfigServiceInterface
  namespace?: string
  service?: string
};

type EmfOutput = {
  _aws: {
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