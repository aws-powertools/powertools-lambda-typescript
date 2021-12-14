import { ConfigServiceInterface } from '../src/config';
import { Handler } from 'aws-lambda';
import { MetricUnit } from './MetricUnit';
import { LambdaInterface } from '../examples/utils/lambda';

type Dimensions = {[key: string]: string};

type MetricsOptions = {
  customConfigService?: ConfigServiceInterface
  namespace?: string
  service?: string
  singleMetric?: boolean
  defaultDimensions?: Dimensions
};

type EmfOutput = {

  [key: string]: string | number | object
  '_aws': {
    Timestamp: number
    CloudWatchMetrics: {
      Namespace: string
      Dimensions: [string[]]
      Metrics: { Name: string; Unit:MetricUnit }[]
    }[]
  }
};

type HandlerMethodDecorator = (target: LambdaInterface, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Handler>) => TypedPropertyDescriptor<Handler> | void;

/**
 * Options for the metrics decorator
 * 
 * Usage:
 * 
 * ```typescript
 * 
 * const metricsOptions: DecoratorOptions = {
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
type DecoratorOptions = {
  raiseOnEmptyMetrics?: boolean
  defaultDimensions?: Dimensions
  captureColdStartMetric?: boolean
};

type StoredMetric = {
  name: string
  unit: MetricUnit
  value: number
};

type StoredMetrics = {
  [key: string]: StoredMetric
};

export {
  DecoratorOptions,
  Dimensions,
  EmfOutput,
  HandlerMethodDecorator,
  MetricsOptions,
  StoredMetrics
};