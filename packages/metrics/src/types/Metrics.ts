import type {
  GenericLogger,
  HandlerMethodDecorator,
} from '@aws-lambda-powertools/commons/types';
import type {
  MetricResolution as MetricResolutions,
  MetricUnit as MetricUnits,
} from '../constants.js';
import type { ConfigServiceInterface } from './ConfigServiceInterface.js';

/**
 * A set of key-value pairs that define the dimensions of a metric.
 */
type Dimensions = Record<string, string>;

/**
 * Options to configure the Metrics class.
 *
 * @example
 * ```typescript
 * import { Metrics } from '@aws-lambda-powertools/metrics';
 *
 * const metrics = new Metrics({
 *   namespace: 'serverlessAirline',
 *   serviceName: 'orders',
 *   singleMetric: true,
 * });
 * ```
 */
type MetricsOptions = {
  /**
   * A custom configuration service to use for retrieving configuration values.
   *
   * @default undefined
   */
  customConfigService?: ConfigServiceInterface;
  /**
   * The namespace to use for all metrics.
   *
   * @default undefined
   */
  namespace?: string;
  /**
   * The service name to use for all metrics.
   *
   * @default undefined
   */
  serviceName?: string;
  /**
   * Whether to configure the Metrics class to emit a single metric as soon as it is added.
   *
   * @default false
   * @see {@link MetricsInterface.singleMetric | `singleMetric()`}
   */
  singleMetric?: boolean;
  /**
   * The default dimensions to add to all metrics.
   *
   * @default {}
   * @see {@link MetricsInterface.setDefaultDimensions | `setDefaultDimensions()`}
   */
  defaultDimensions?: Dimensions;
  /**
   * Logger object to be used for emitting debug, warning, and error messages.
   *
   * If not provided, debug messages will be suppressed, and warning and error messages will be sent to stdout.
   *
   * Note that EMF metrics are always sent directly to stdout, regardless of the logger
   * to avoid any potential side effects from using a custom logger.
   */
  logger?: GenericLogger;
};

/**
 * The output of the {@link MetricsInterface.serializeMetrics | `serializeMetrics()`} method,
 * compliant with the {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html | Amazon CloudWatch Embedded Metric Format (EMF)}.
 */
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
 * Options to customize the behavior of the {@link MetricsInterface.logMetrics | `logMetrics()`} decorator or Middy.js middleware.
 */
type ExtraOptions = {
  /**
   * Whether to throw an error if no metrics are emitted.
   *
   * @default false
   * @see {@link MetricsInterface.publishStoredMetrics | `publishStoredMetrics()`}
   */
  throwOnEmptyMetrics?: boolean;
  /**
   * Default dimensions to add to all metrics.
   *
   * @default {}
   * @see {@link MetricsInterface.setDefaultDimensions | `setDefaultDimensions()`}
   */
  defaultDimensions?: Dimensions;
  /**
   * Whether to capture a `ColdStart` metric.
   *
   * @default false
   * @see {@link MetricsInterface.captureColdStartMetric | `captureColdStartMetric()`}
   */
  captureColdStartMetric?: boolean;
};

/**
 * A list of possible metric resolutions.
 *
 * @see {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Resolution_definition | Amazon CloudWatch Resolution}
 */
type MetricResolution =
  (typeof MetricResolutions)[keyof typeof MetricResolutions];

/**
 * A list of possible metric units.
 *
 * @see {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Unit | Amazon CloudWatch Units}
 */
type MetricUnit = (typeof MetricUnits)[keyof typeof MetricUnits];

/**
 * Data structure to store a metric that has been added to the Metrics class.
 */
type StoredMetric = {
  name: string;
  unit: MetricUnit;
  value: number | number[];
  resolution: MetricResolution;
};

/**
 * A map of stored metrics, where the key is the metric name and the value is the stored metric.
 */
type StoredMetrics = Record<string, StoredMetric>;

/**
 * A definition of a metric that can be added to the Metrics class.
 */
type MetricDefinition = {
  Name: string;
  Unit: MetricUnit;
  StorageResolution?: MetricResolution;
};

interface MetricsInterface {
  /**
   * Add a dimension to metrics.
   *
   * A dimension is a key-value pair that is used to group metrics, and it is included in all metrics emitted after it is added.
   *
   * When calling the {@link MetricsInterface.publishStoredMetrics | `publishStoredMetrics()`} method, the dimensions are cleared. This type of
   * dimension is useful when you want to add request-specific dimensions to your metrics. If you want to add dimensions that are
   * included in all metrics, use the {@link MetricsInterface.setDefaultDimensions | `setDefaultDimensions()`} method.
   *
   * @param name - The name of the dimension
   * @param value - The value of the dimension
   */
  addDimension(name: string, value: string): void;
  /**
   * Add multiple dimensions to the metrics.
   *
   * This method is useful when you want to add multiple dimensions to the metrics at once.
   *
   * When calling the {@link MetricsInterface.publishStoredMetrics | `publishStoredMetrics()`} method, the dimensions are cleared. This type of
   * dimension is useful when you want to add request-specific dimensions to your metrics. If you want to add dimensions that are
   * included in all metrics, use the {@link MetricsInterface.setDefaultDimensions | `setDefaultDimensions()`} method.
   *
   * @param dimensions - An object with key-value pairs of dimensions
   */
  addDimensions(dimensions: Dimensions): void;
  /**
   * A metadata key-value pair to be included with metrics.
   *
   * You can use this method to add high-cardinality data as part of your metrics.
   * This is useful when you want to search highly contextual information along with your metrics in your logs.
   *
   * Note that the metadata is not included in the Amazon CloudWatch UI, but it can be used to search and filter logs.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * export const handler = async (event) => {
   *   metrics.addMetadata('request_id', event.requestId);
   *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   *   metrics.publishStoredMetrics();
   * };
   * ```
   *
   * @param key - The key of the metadata
   * @param value - The value of the metadata
   */
  addMetadata(key: string, value: string): void;
  /**
   * Add a metric to the metrics buffer.
   *
   * By default, metrics are buffered and flushed when calling {@link MetricsInterface.publishStoredMetrics | `publishStoredMetrics()`} method,
   * or at the end of the handler function when using the {@link MetricsInterface.logMetrics | `logMetrics()`} decorator or the Middy.js middleware.
   *
   * Metrics are emitted to standard output in the Amazon CloudWatch EMF (Embedded Metric Format) schema. In AWS Lambda, the logs are
   * automatically picked up by CloudWatch logs and processed asynchronously.
   *
   * You can add a metric by specifying the metric name, unit, and value. For convenience,
   * we provide a set of constants for the most common units in the {@link MetricUnits | MetricUnit} dictionary object.
   *
   * Optionally, you can specify a {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Resolution_definition | resolution}, which can be either `High` or `Standard`, using the {@link MetricResolutions | MetricResolution} dictionary object.
   * By default, metrics are published with a resolution of `Standard`.
   *
   * @example
   * ```typescript
   * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * export const handler = async () => {
   *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   *   metrics.publishStoredMetrics();
   * };
   * ```
   *
   * @param name - The metric name
   * @param unit - The metric unit, see {@link MetricUnits | MetricUnit}
   * @param value - The metric value
   * @param resolution - The metric resolution, see {@link MetricResolutions | MetricResolution}
   */
  addMetric(
    name: string,
    unit: MetricUnit,
    value: number,
    resolution?: MetricResolution
  ): void;
  /**
   * Immediately emit a `ColdStart` metric if this is a cold start invocation.
   *
   * A cold start is when AWS Lambda initializes a new instance of your function. To take advantage of this feature,
   * you must instantiate the Metrics class outside of the handler function.
   *
   * By using this method, the metric will be emitted immediately without you having to call {@link MetricsInterface.publishStoredMetrics | `publishStoredMetrics()`}.
   *
   * If you are using the {@link MetricsInterface.logMetrics | `logMetrics()`} decorator, or the Middy.js middleware, you can enable this
   * feature by setting the `captureColdStartMetric` option to `true`.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * export const handler = async () => {
   *   metrics.captureColdStartMetric();
   * };
   * ```
   */
  captureColdStartMetric(): void;
  /**
   * Clear all previously set default dimensions.
   *
   * This will remove all default dimensions set by the {@link MetricsInterface.setDefaultDimensions | `setDefaultDimensions()`} method
   * or via the `defaultDimensions` parameter in the constructor.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders',
   *   defaultDimensions: { environment: 'dev' },
   * });
   *
   * metrics.setDefaultDimensions({ region: 'us-west-2' });
   *
   * // both environment and region dimensions are removed
   * metrics.clearDefaultDimensions();
   * ```
   */
  clearDefaultDimensions(): void;
  /**
   * Clear all the dimensions added to the Metrics instance via {@link MetricsInterface.addDimension | `addDimension()`} or {@link MetricsInterface.addDimensions | `addDimensions()`}.
   *
   * These dimensions are normally cleared when calling {@link MetricsInterface.publishStoredMetrics | `publishStoredMetrics()`}, but
   * you can use this method to clear specific dimensions that you no longer need at runtime.
   *
   * This method does not clear the default dimensions set via {@link MetricsInterface.setDefaultDimensions | `setDefaultDimensions()`} or via
   * the `defaultDimensions` parameter in the constructor.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * export const handler = async () => {
   *   metrics.addDimension('region', 'us-west-2');
   *
   *   // ...
   *
   *   metrics.clearDimensions(); // olnly the region dimension is removed
   * };
   * ```
   *
   * The method is primarily intended for internal use, but it is exposed for advanced use cases.
   */
  clearDimensions(): void;
  /**
   * Clear all the metadata added to the Metrics instance.
   *
   * Metadata is normally cleared when calling {@link MetricsInterface.publishStoredMetrics | `publishStoredMetrics()`}, but
   * you can use this method to clear specific metadata that you no longer need at runtime.
   *
   * The method is primarily intended for internal use, but it is exposed for advanced use cases.
   */
  clearMetadata(): void;
  /**
   * Clear all the metrics stored in the buffer.
   *
   * This is useful when you want to clear the metrics stored in the buffer without publishing them.
   *
   * The method is primarily intended for internal use, but it is exposed for advanced use cases.
   */
  clearMetrics(): void;
  /**
   * A class method decorator to automatically log metrics after the method returns or throws an error.
   *
   * The decorator can be used with TypeScript classes and can be configured to optionally capture a `ColdStart` metric (see {@link MetricsInterface.captureColdStartMetric | `captureColdStartMetric()`}),
   * throw an error if no metrics are emitted (see {@link MetricsInterface.setThrowOnEmptyMetrics | `setThrowOnEmptyMetrics()`}),
   * and set default dimensions for all metrics (see {@link MetricsInterface.setDefaultDimensions | `setDefaultDimensions()`}).
   *
   * @example
   *
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * class Lambda implements LambdaInterface {
   *   ⁣@metrics.logMetrics({ captureColdStartMetric: true })
   *   public handler(_event: unknown, _context: unknown) {
   *     // ...
   *   }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);
   * ```
   *
   * You can configure the decorator with the following options:
   * - `captureColdStartMetric`: Whether to capture a `ColdStart` metric
   * - `defaultDimensions`: Default dimensions to add to all metrics
   * - `throwOnEmptyMetrics`: Whether to throw an error if no metrics are emitted
   *
   * @param options - Options to configure the behavior of the decorator, see {@link ExtraOptions}
   */
  logMetrics(options?: ExtraOptions): HandlerMethodDecorator;
  /**
   * Flush the stored metrics to standard output.
   *
   * The method empties the metrics buffer and emits the metrics to standard output in the Amazon CloudWatch EMF (Embedded Metric Format) schema.
   *
   * When using the {@link MetricsInterface.logMetrics | `logMetrics()`} decorator, or the Middy.js middleware, the metrics are automatically flushed after the handler function returns or throws an error.
   *
   * @example
   * ```typescript
   * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * export const handler = async () => {
   *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   *   metrics.publishStoredMetrics();
   * };
   * ```
   */
  publishStoredMetrics(): void;
  /**
   * Serialize the stored metrics into a JSON object compliant with the Amazon CloudWatch EMF (Embedded Metric Format) schema.
   *
   * The EMF schema is a JSON object that contains the following properties:
   * - `_aws`: An object containing the timestamp and the CloudWatch metrics.
   * - `CloudWatchMetrics`: An array of CloudWatch metrics objects.
   * - `Namespace`: The namespace of the metrics.
   * - `Dimensions`: An array of dimensions for the metrics.
   * - `Metrics`: An array of metric definitions.
   *
   * The serialized object is returned for later use.
   *
   * This is primarily an internal method used by the Metrics class, but it is exposed for advanced use cases.
   */
  serializeMetrics(): EmfOutput;
  /**
   * Set default dimensions that will be added to all metrics.
   *
   * This method will merge the provided dimensions with the existing default dimensions.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders',
   *   defaultDimensions: { environment: 'dev' },
   * });
   *
   * // Default dimensions will contain both region and environment
   * metrics.setDefaultDimensions({
   *   region: 'us-west-2',
   *   environment: 'prod',
   * });
   * ```
   *
   * @param dimensions - The dimensions to be added to the default dimensions object
   */
  setDefaultDimensions(dimensions: Dimensions | undefined): void;
  /**
   * Set the function name to be added to each metric as a dimension.
   *
   * When using the {@link MetricsInterface.logMetrics | `logMetrics()`} decorator, or the Middy.js middleware, the function
   * name is automatically inferred from the Lambda context.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * metrics.setFunctionName('my-function-name');
   * ```
   *
   * @param name - The function name
   */
  setFunctionName(name: string): void;
  /**
   * Set the flag to throw an error if no metrics are emitted.
   *
   * You can use this method to enable or disable this opt-in feature. This is useful if you want to ensure
   * that at least one metric is emitted when flushing the metrics. This can be useful to catch bugs where
   * metrics are not being emitted as expected.
   *
   * @param enabled - Whether to throw an error if no metrics are emitted
   */
  setThrowOnEmptyMetrics(enabled: boolean): void;
  /**
   * Create a new Metrics instance configured to immediately flush a single metric.
   *
   * CloudWatch EMF uses the same dimensions and timestamp across all your metrics, this is useful when you have a metric that should have different dimensions
   * or when you want to emit a single metric without buffering it.
   *
   * This method is used internally by the {@link MetricsInterface.captureColdStartMetric | `captureColdStartMetric()`} method to emit the `ColdStart` metric immediately
   * after the handler function is called.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * export const handler = async () => {
   *   const singleMetric = metrics.singleMetric();
   *   // The single metric will be emitted immediately
   *   singleMetric.addMetric('coldStart', MetricUnit.Count, 1);
   *
   *   // These other metrics will be buffered and emitted when calling `publishStoredMetrics()`
   *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   *   metrics.publishStoredMetrics();
   * };
   */
  singleMetric(): MetricsInterface;
}

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
  MetricsInterface,
};
