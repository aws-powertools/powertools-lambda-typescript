import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { Handler } from 'aws-lambda';
import { ConfigServiceInterface } from '../config';
import { MetricUnit } from './MetricUnit';

type Dimensions = { [key: string]: string };

type MetricsOptions = {
  customConfigService?: ConfigServiceInterface
  namespace?: string
  service?: string
  singleMetric?: boolean
  defaultDimensions?: Dimensions
};

type EmfOutput = {
  [key: string]: string | number | object
  _aws: {
    Timestamp: number
    CloudWatchMetrics: {
      Namespace: string
      Dimensions: [string[]]
      Metrics: { Name: string; Unit: MetricUnit }[]
    }[]
  }
};

type HandlerMethodDecorator = (
  target: LambdaInterface,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<Handler>
) => TypedPropertyDescriptor<Handler> | void;

/**
 * Options for the metrics decorator
 *
 * Usage:
 *
 * ```typescript
 *
 * const metricsOptions: MetricsOptions = {
 *   raiseOnEmptyMetrics: true,
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
  raiseOnEmptyMetrics?: boolean
  defaultDimensions?: Dimensions
  captureColdStartMetric?: boolean
};

type StoredMetric = {
  name: string
  unit: MetricUnit
  value: number | number[]
};

type StoredMetrics = {
  [key: string]: StoredMetric
};

export { MetricsOptions, Dimensions, EmfOutput, HandlerMethodDecorator, ExtraOptions, StoredMetrics };
