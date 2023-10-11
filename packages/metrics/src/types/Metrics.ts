import type { Handler } from 'aws-lambda';
import type {
  LambdaInterface,
  AsyncHandler,
  SyncHandler,
} from '@aws-lambda-powertools/commons/types';
import { ConfigServiceInterface } from '../config';
import { MetricUnit } from './MetricUnit';
import { MetricResolution } from './MetricResolution';

type Dimensions = Record<string, string>;

type MetricsOptions = {
  customConfigService?: ConfigServiceInterface;
  namespace?: string;
  serviceName?: string;
  singleMetric?: boolean;
  defaultDimensions?: Dimensions;
};

type EmfOutput = Readonly<{
  [key: string]: string | number | object;
  _aws: {
    Timestamp: number;
    CloudWatchMetrics: {
      Namespace: string;
      Dimensions: [string[]];
      Metrics: MetricDefinition[];
    }[];
  };
}>;

type HandlerMethodDecorator = (
  target: LambdaInterface,
  propertyKey: string | symbol,
  descriptor:
    | TypedPropertyDescriptor<SyncHandler<Handler>>
    | TypedPropertyDescriptor<AsyncHandler<Handler>>
) => void;

/**
 * Options for the metrics decorator
 *
 * Usage:
 *
 * ```typescript
 *
 * const metricsOptions: MetricsOptions = {
 *   throwOnEmptyMetrics: true,
 *   defaultDimensions: {'environment': 'dev'},
 *   captureColdStartMetric: true,
 * }
 *
 * @metrics.logMetric(metricsOptions)
 * public handler(event: any, context: any, callback: any) {
 *   // ...
 * }
 * ```
 */
type ExtraOptions = {
  throwOnEmptyMetrics?: boolean;
  defaultDimensions?: Dimensions;
  captureColdStartMetric?: boolean;
};

type StoredMetric = {
  name: string;
  unit: MetricUnit;
  value: number | number[];
  resolution: MetricResolution;
};

type StoredMetrics = Record<string, StoredMetric>;

type MetricDefinition = {
  Name: string;
  Unit: MetricUnit;
  StorageResolution?: MetricResolution;
};

export {
  MetricsOptions,
  Dimensions,
  EmfOutput,
  HandlerMethodDecorator,
  ExtraOptions,
  StoredMetrics,
  StoredMetric,
  MetricDefinition,
};
