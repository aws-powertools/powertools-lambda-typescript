import type {
  MetricResolution as MetricResolutionList,
  MetricUnit as MetricUnitList,
} from '../constants.js';
import type { ConfigServiceInterface } from './ConfigServiceInterface.js';

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

type MetricResolution =
  (typeof MetricResolutionList)[keyof typeof MetricResolutionList];

type MetricUnit = (typeof MetricUnitList)[keyof typeof MetricUnitList];

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

export type {
  MetricsOptions,
  Dimensions,
  EmfOutput,
  ExtraOptions,
  StoredMetrics,
  StoredMetric,
  MetricDefinition,
  MetricResolution,
  MetricUnit,
};
