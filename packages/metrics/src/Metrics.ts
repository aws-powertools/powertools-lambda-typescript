import { Console } from 'node:console';
import { Utility, isIntegerNumber } from '@aws-lambda-powertools/commons';
import type {
  GenericLogger,
  HandlerMethodDecorator,
} from '@aws-lambda-powertools/commons/types';
import type { Callback, Context, Handler } from 'aws-lambda';
import { EnvironmentVariablesService } from './config/EnvironmentVariablesService.js';
import {
  COLD_START_METRIC,
  DEFAULT_NAMESPACE,
  EMF_MAX_TIMESTAMP_FUTURE_AGE,
  EMF_MAX_TIMESTAMP_PAST_AGE,
  MAX_DIMENSION_COUNT,
  MAX_METRICS_SIZE,
  MAX_METRIC_VALUES_SIZE,
  MetricResolution as MetricResolutions,
  MetricUnit as MetricUnits,
} from './constants.js';
import type {
  ConfigServiceInterface,
  Dimensions,
  EmfOutput,
  ExtraOptions,
  MetricDefinition,
  MetricResolution,
  MetricUnit,
  MetricsInterface,
  MetricsOptions,
  StoredMetrics,
} from './types/index.js';

/**
 * The Metrics utility creates custom metrics asynchronously by logging metrics to standard output following {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html | Amazon CloudWatch Embedded Metric Format (EMF)}.
 *
 * These metrics can be visualized through Amazon CloudWatch Console.
 *
 * **Key features**
 * * Aggregating up to 100 metrics using a single CloudWatch EMF object (large JSON blob).
 * * Validating your metrics against common metric definitions mistakes (for example, metric unit, values, max dimensions, max metrics).
 * * Metrics are created asynchronously by the CloudWatch service. You do not need any custom stacks, and there is no impact to Lambda function latency.
 * * Creating a one-off metric with different dimensions.
 *
 * After initializing the Metrics class, you can add metrics using the {@link Metrics.addMetric | `addMetric()`} method.
 * The metrics are stored in a buffer and are flushed when calling {@link Metrics.publishStoredMetrics | `publishStoredMetrics()`}.
 * Each metric can have dimensions and metadata added to it.
 *
 * @example
 * ```typescript
 * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
 *
 * const metrics = new Metrics({
 *   namespace: 'serverlessAirline',
 *   serviceName: 'orders',
 *   defaultDimensions: { environment: 'dev' },
 * });
 *
 * export const handler = async (event: { requestId: string }) => {
 *   metrics.addMetadata('request_id', event.requestId);
 *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
 *   metrics.publishStoredMetrics();
 * };
 * ```
 *
 * If you don't want to manually flush the metrics, you can use the {@link Metrics.logMetrics | `logMetrics()`} decorator or
 * the Middy.js middleware to automatically flush the metrics after the handler function returns or throws an error.
 *
 * In addition to this, the decorator and middleware can also be configured to capture a `ColdStart` metric and
 * set default dimensions for all metrics.
 *
 * **Class method decorator**
 *
 * @example
 *
 * ```typescript
 * import type { Context } from 'aws-lambda';
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
 *
 * const metrics = new Metrics({
 *   namespace: 'serverlessAirline',
 *   serviceName: 'orders'
 * });
 *
 * class Lambda implements LambdaInterface {
 *   ⁣@metrics.logMetrics({ captureColdStartMetric: true, throwOnEmptyMetrics: true })
 *   public async handler(_event: { requestId: string }, _: Context) {
 *     metrics.addMetadata('request_id', event.requestId);
 *     metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
 *   }
 * }
 *
 * const handlerClass = new Lambda();
 * export const handler = handlerClass.handler.bind(handlerClass);
 * ```
 *
 * Note that decorators are a Stage 3 proposal for JavaScript and are not yet part of the ECMAScript standard.
 * The current implmementation in this library is based on the legacy TypeScript decorator syntax enabled by the [`experimentalDecorators` flag](https://www.typescriptlang.org/tsconfig/#experimentalDecorators)
 * set to `true` in the `tsconfig.json` file.
 *
 * **Middy.js middleware**
 *
 * @example
 *
 * ```typescript
 * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
 * import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
 * import middy from '@middy/core';
 *
 * const metrics = new Metrics({
 *   namespace: 'serverlessAirline',
 *   serviceName: 'orders'
 * });
 *
 * export const handler = middy(async () => {
 *   metrics.addMetadata('request_id', event.requestId);
 *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
 * }).use(logMetrics(metrics, {
 *   captureColdStartMetric: true,
 *   throwOnEmptyMetrics: true,
 * }));
 * ```
 *
 * The `logMetrics()` middleware is compatible with `@middy/core@3.x` and above.
 *
 */
class Metrics extends Utility implements MetricsInterface {
  /**
   * Console instance used to print logs.
   *
   * In AWS Lambda, we create a new instance of the Console class so that we can have
   * full control over the output of the logs. In testing environments, we use the
   * default console instance.
   *
   * This property is initialized in the constructor in setOptions().
   *
   * @private
   */
  private console!: Console;
  /**
   * Custom configuration service for metrics
   */
  private customConfigService?: ConfigServiceInterface;

  /**
   * Default dimensions to be added to all metrics
   * @default {}
   */
  private defaultDimensions: Dimensions = {};

  /**
   * Additional dimensions for the current metrics context
   * @default {}
   */
  private dimensions: Dimensions = {};

  /**
   * Service for accessing environment variables
   */
  private envVarsService?: EnvironmentVariablesService;

  /**
   * Name of the Lambda function
   */
  private functionName?: string;

  /**
   * Custom logger object used for emitting debug, warning, and error messages.
   *
   * Note that this logger is not used for emitting metrics which are emitted to standard output using the `Console` object.
   */
  readonly #logger: GenericLogger;

  /**
   * Flag indicating if this is a single metric instance
   * @default false
   */
  private isSingleMetric = false;

  /**
   * Additional metadata to be included with metrics
   * @default {}
   */
  private metadata: Record<string, string> = {};

  /**
   * Namespace for the metrics
   */
  private namespace?: string;

  /**
   * Flag to determine if an error should be thrown when no metrics are recorded
   * @default false
   */
  private shouldThrowOnEmptyMetrics = false;

  /**
   * Storage for metrics before they are published
   * @default {}
   */
  private storedMetrics: StoredMetrics = {};

  /**
   * Whether to disable metrics
   */
  private disabled = false;

  /**
   * Custom timestamp for the metrics
   */
  #timestamp?: number;

  public constructor(options: MetricsOptions = {}) {
    super();

    this.dimensions = {};
    this.setOptions(options);
    this.#logger = options.logger || this.console;
  }

  /**
   * Add a dimension to metrics.
   *
   * A dimension is a key-value pair that is used to group metrics, and it is included in all metrics emitted after it is added.
   * Invalid dimension values are skipped and a warning is logged.
   *
   * When calling the {@link Metrics.publishStoredMetrics | `publishStoredMetrics()`} method, the dimensions are cleared. This type of
   * dimension is useful when you want to add request-specific dimensions to your metrics. If you want to add dimensions that are
   * included in all metrics, use the {@link Metrics.setDefaultDimensions | `setDefaultDimensions()`} method.
   *
   * @param name - The name of the dimension
   * @param value - The value of the dimension
   */
  public addDimension(name: string, value: string): void {
    if (!value) {
      this.#logger.warn(
        `The dimension ${name} doesn't meet the requirements and won't be added. Ensure the dimension name and value are non empty strings`
      );
      return;
    }
    if (MAX_DIMENSION_COUNT <= this.getCurrentDimensionsCount()) {
      throw new RangeError(
        `The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`
      );
    }
    if (
      Object.hasOwn(this.dimensions, name) ||
      Object.hasOwn(this.defaultDimensions, name)
    ) {
      this.#logger.warn(
        `Dimension "${name}" has already been added. The previous value will be overwritten.`
      );
    }
    this.dimensions[name] = value;
  }

  /**
   * Add multiple dimensions to the metrics.
   *
   * This method is useful when you want to add multiple dimensions to the metrics at once.
   * Invalid dimension values are skipped and a warning is logged.
   *
   * When calling the {@link Metrics.publishStoredMetrics | `publishStoredMetrics()`} method, the dimensions are cleared. This type of
   * dimension is useful when you want to add request-specific dimensions to your metrics. If you want to add dimensions that are
   * included in all metrics, use the {@link Metrics.setDefaultDimensions | `setDefaultDimensions()`} method.
   *
   * @param dimensions - An object with key-value pairs of dimensions
   */
  public addDimensions(dimensions: Dimensions): void {
    for (const [name, value] of Object.entries(dimensions)) {
      this.addDimension(name, value);
    }
  }

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
  public addMetadata(key: string, value: string): void {
    this.metadata[key] = value;
  }

  /**
   * Add a metric to the metrics buffer.
   *
   * By default, metrics are buffered and flushed when calling {@link Metrics.publishStoredMetrics | `publishStoredMetrics()`} method,
   * or at the end of the handler function when using the {@link Metrics.logMetrics | `logMetrics()`} decorator or the Middy.js middleware.
   *
   * Metrics are emitted to standard output in the Amazon CloudWatch EMF (Embedded Metric Format) schema.
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
  public addMetric(
    name: string,
    unit: MetricUnit,
    value: number,
    resolution: MetricResolution = MetricResolutions.Standard
  ): void {
    this.storeMetric(name, unit, value, resolution);
    if (this.isSingleMetric) this.publishStoredMetrics();
  }

  /**
   * Immediately emit a `ColdStart` metric if this is a cold start invocation.
   *
   * A cold start is when AWS Lambda initializes a new instance of your function. To take advantage of this feature,
   * you must instantiate the Metrics class outside of the handler function.
   *
   * By using this method, the metric will be emitted immediately without you having to call {@link Metrics.publishStoredMetrics | `publishStoredMetrics()`}.
   *
   * If you are using the {@link Metrics.logMetrics | `logMetrics()`} decorator, or the Middy.js middleware, you can enable this
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
  public captureColdStartMetric(): void {
    if (!this.getColdStart()) return;
    const singleMetric = this.singleMetric();

    if (this.defaultDimensions.service) {
      singleMetric.setDefaultDimensions({
        service: this.defaultDimensions.service,
      });
    }
    if (this.functionName != null) {
      singleMetric.addDimension('function_name', this.functionName);
    }
    singleMetric.addMetric(COLD_START_METRIC, MetricUnits.Count, 1);
  }

  /**
   * Clear all previously set default dimensions.
   *
   * This will remove all default dimensions set by the {@link Metrics.setDefaultDimensions | `setDefaultDimensions()`} method
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
  public clearDefaultDimensions(): void {
    this.defaultDimensions = {};
  }

  /**
   * Clear all the dimensions added to the Metrics instance via {@link Metrics.addDimension | `addDimension()`} or {@link Metrics.addDimensions | `addDimensions()`}.
   *
   * These dimensions are normally cleared when calling {@link Metrics.publishStoredMetrics | `publishStoredMetrics()`}, but
   * you can use this method to clear specific dimensions that you no longer need at runtime.
   *
   * This method does not clear the default dimensions set via {@link Metrics.setDefaultDimensions | `setDefaultDimensions()`} or via
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
  public clearDimensions(): void {
    this.dimensions = {};
  }

  /**
   * Clear all the metadata added to the Metrics instance.
   *
   * Metadata is normally cleared when calling {@link Metrics.publishStoredMetrics | `publishStoredMetrics()`}, but
   * you can use this method to clear specific metadata that you no longer need at runtime.
   *
   * The method is primarily intended for internal use, but it is exposed for advanced use cases.
   */
  public clearMetadata(): void {
    this.metadata = {};
  }

  /**
   * Clear all the metrics stored in the buffer.
   *
   * This is useful when you want to clear the metrics stored in the buffer without publishing them.
   *
   * The method is primarily intended for internal use, but it is exposed for advanced use cases.
   */
  public clearMetrics(): void {
    this.storedMetrics = {};
  }

  /**
   * Check if there are stored metrics in the buffer.
   */
  public hasStoredMetrics(): boolean {
    return Object.keys(this.storedMetrics).length > 0;
  }

  /**
   * Check if a function name has been defined.
   *
   * This is useful when you want to only set a function name if it is not already set.
   *
   * The method is primarily intended for internal use, but it is exposed for advanced use cases.
   */
  public hasFunctionName(): boolean {
    return this.functionName != null;
  }

  /**
   * Whether metrics are disabled.
   */
  protected isDisabled(): boolean {
    return this.disabled;
  }

  /**
   * A class method decorator to automatically log metrics after the method returns or throws an error.
   *
   * The decorator can be used with TypeScript classes and can be configured to optionally capture a `ColdStart` metric (see {@link Metrics.captureColdStartMetric | `captureColdStartMetric()`}),
   * throw an error if no metrics are emitted (see {@link Metrics.setThrowOnEmptyMetrics | `setThrowOnEmptyMetrics()`}),
   * and set default dimensions for all metrics (see {@link Metrics.setDefaultDimensions | `setDefaultDimensions()`}).
   *
   * @example
   *
   * ```typescript
   * import type { Context } from 'aws-lambda';
   * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
   * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders'
   * });
   *
   * class Lambda implements LambdaInterface {
   *   ⁣@metrics.logMetrics({ captureColdStartMetric: true })
   *   public async handler(_event: { requestId: string }, _: Context) {
   *     metrics.addMetadata('request_id', event.requestId);
   *     metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   *   }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);
   * ```
   *
   * You can configure the decorator with the following options:
   * - `captureColdStartMetric` - Whether to capture a `ColdStart` metric
   * - `defaultDimensions` - Default dimensions to add to all metrics
   * - `throwOnEmptyMetrics` - Whether to throw an error if no metrics are emitted
   * - `functionName` - Set the function name used for cold starts
   *
   * @param options - Options to configure the behavior of the decorator, see {@link ExtraOptions}
   */
  public logMetrics(options: ExtraOptions = {}): HandlerMethodDecorator {
    const {
      throwOnEmptyMetrics,
      defaultDimensions,
      captureColdStartMetric,
      functionName,
    } = options;
    if (throwOnEmptyMetrics) {
      this.setThrowOnEmptyMetrics(throwOnEmptyMetrics);
    }
    if (defaultDimensions !== undefined) {
      this.setDefaultDimensions(defaultDimensions);
    }
    if (functionName !== undefined) {
      this.setFunctionName(functionName);
    }

    return (_target, _propertyKey, descriptor) => {
      // biome-ignore lint/style/noNonNullAssertion: The descriptor.value is the method this decorator decorates, it cannot be undefined.
      const originalMethod = descriptor.value!;
      const metricsRef = this;
      // Use a function() {} instead of an () => {} arrow function so that we can
      // access `myClass` as `this` in a decorated `myClass.myMethod()`.
      descriptor.value = async function (
        this: Handler,
        event: unknown,
        context: Context,
        callback: Callback
      ): Promise<unknown> {
        if (!metricsRef.hasFunctionName()) {
          metricsRef.functionName = context.functionName;
        }
        if (captureColdStartMetric) metricsRef.captureColdStartMetric();

        let result: unknown;
        try {
          result = await originalMethod.apply(this, [event, context, callback]);
        } finally {
          metricsRef.publishStoredMetrics();
        }

        return result;
      };

      return descriptor;
    };
  }

  /**
   * Flush the stored metrics to standard output.
   *
   * The method empties the metrics buffer and emits the metrics to standard output in the Amazon CloudWatch EMF (Embedded Metric Format) schema.
   *
   * When using the {@link Metrics.logMetrics | `logMetrics()`} decorator, or the Middy.js middleware, the metrics are automatically flushed after the handler function returns or throws an error.
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
  public publishStoredMetrics(): void {
    const hasMetrics = this.hasStoredMetrics();
    if (!this.shouldThrowOnEmptyMetrics && !hasMetrics) {
      this.#logger.warn(
        'No application metrics to publish. The cold-start metric may be published if enabled. ' +
          'If application metrics should never be empty, consider using `throwOnEmptyMetrics`'
      );
    }

    if (!this.disabled) {
      const emfOutput = this.serializeMetrics();
      hasMetrics && this.console.log(JSON.stringify(emfOutput));
    }

    this.clearMetrics();
    this.clearDimensions();
    this.clearMetadata();
  }

  /**
   * Sets the timestamp for the metric.
   *
   * If an integer is provided, it is assumed to be the epoch time in milliseconds.
   * If a Date object is provided, it will be converted to epoch time in milliseconds.
   *
   * The timestamp must be a Date object or an integer representing an epoch time.
   * This should not exceed 14 days in the past or be more than 2 hours in the future.
   * Any metrics failing to meet this criteria will be skipped by Amazon CloudWatch.
   *
   * See: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
   * See: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatch-Logs-Monitoring-CloudWatch-Metrics.html
   *
   * @example
   * ```typescript
   * import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({
   *   namespace: 'serverlessAirline',
   *   serviceName: 'orders',
   * });
   *
   * export const handler = async () => {
   *   const metricTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
   *   metrics.setTimestamp(metricTimestamp);
   *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   * };
   * ```
   * @param timestamp - The timestamp to set, which can be a number or a Date object.
   */
  public setTimestamp(timestamp: number | Date): void {
    if (!this.#validateEmfTimestamp(timestamp)) {
      this.#logger.warn(
        "This metric doesn't meet the requirements and will be skipped by Amazon CloudWatch. " +
          'Ensure the timestamp is within 14 days in the past or up to 2 hours in the future and is also a valid number or Date object.'
      );
    }
    this.#timestamp = this.#convertTimestampToEmfFormat(timestamp);
  }

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
   * The object is then emitted to standard output, which in AWS Lambda is picked up by CloudWatch logs and processed asynchronously.
   */
  public serializeMetrics(): EmfOutput {
    // Storage resolution is included only for High resolution metrics
    const metricDefinitions: MetricDefinition[] = Object.values(
      this.storedMetrics
    ).map((metricDefinition) => ({
      Name: metricDefinition.name,
      Unit: metricDefinition.unit,
      ...(metricDefinition.resolution === MetricResolutions.High
        ? { StorageResolution: metricDefinition.resolution }
        : {}),
    }));

    if (metricDefinitions.length === 0 && this.shouldThrowOnEmptyMetrics) {
      throw new RangeError(
        'The number of metrics recorded must be higher than zero'
      );
    }

    if (!this.namespace)
      this.#logger.warn('Namespace should be defined, default used');

    // We reduce the stored metrics to a single object with the metric
    // name as the key and the value as the value.
    const metricValues = Object.values(this.storedMetrics).reduce(
      (
        result: Record<string, number | number[]>,
        { name, value }: { name: string; value: number | number[] }
      ) => {
        result[name] = value;

        return result;
      },
      {}
    );

    const dimensionNames = [
      ...new Set([
        ...Object.keys(this.defaultDimensions),
        ...Object.keys(this.dimensions),
      ]),
    ];

    return {
      _aws: {
        Timestamp: this.#timestamp ?? new Date().getTime(),
        CloudWatchMetrics: [
          {
            Namespace: this.namespace || DEFAULT_NAMESPACE,
            Dimensions: [dimensionNames],
            Metrics: metricDefinitions,
          },
        ],
      },
      ...this.defaultDimensions,
      ...this.dimensions,
      ...metricValues,
      ...this.metadata,
    };
  }

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
  public setDefaultDimensions(dimensions: Dimensions | undefined): void {
    const targetDimensions = {
      ...this.defaultDimensions,
      ...dimensions,
    };
    if (MAX_DIMENSION_COUNT <= Object.keys(targetDimensions).length) {
      throw new Error('Max dimension count hit');
    }
    this.defaultDimensions = targetDimensions;
  }

  /**
   * Set the function name to be added to each metric as a dimension.
   *
   * When using the {@link Metrics.logMetrics | `logMetrics()`} decorator, or the Middy.js middleware, the function
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
  public setFunctionName(name: string): void {
    this.functionName = name;
  }

  /**
   * Set the flag to throw an error if no metrics are emitted.
   *
   * You can use this method to enable or disable this opt-in feature. This is useful if you want to ensure
   * that at least one metric is emitted when flushing the metrics. This can be useful to catch bugs where
   * metrics are not being emitted as expected.
   *
   * @param enabled - Whether to throw an error if no metrics are emitted
   */
  public setThrowOnEmptyMetrics(enabled: boolean): void {
    this.shouldThrowOnEmptyMetrics = enabled;
  }

  /**
   * Create a new Metrics instance configured to immediately flush a single metric.
   *
   * CloudWatch EMF uses the same dimensions and timestamp across all your metrics, this is useful when you have a metric that should have different dimensions
   * or when you want to emit a single metric without buffering it.
   *
   * This method is used internally by the {@link Metrics.captureColdStartMetric | `captureColdStartMetric()`} method to emit the `ColdStart` metric immediately
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
   *   singleMetric.addMetric('ColdStart', MetricUnit.Count, 1);
   *
   *   // These other metrics will be buffered and emitted when calling `publishStoredMetrics()`
   *   metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   *   metrics.publishStoredMetrics();
   * };
   */
  public singleMetric(): Metrics {
    return new Metrics({
      namespace: this.namespace,
      serviceName: this.dimensions.service,
      defaultDimensions: this.defaultDimensions,
      singleMetric: true,
      logger: this.#logger,
    });
  }

  /**
   * @deprecated Use {@link Metrics.setThrowOnEmptyMetrics | `setThrowOnEmptyMetrics()`} instead.
   */
  /* v8 ignore start */ public throwOnEmptyMetrics(): void {
    this.shouldThrowOnEmptyMetrics = true;
  } /* v8 ignore stop */

  /**
   * Gets the current number of dimensions count.
   */
  private getCurrentDimensionsCount(): number {
    return (
      Object.keys(this.dimensions).length +
      Object.keys(this.defaultDimensions).length
    );
  }

  /**
   * Get the custom config service if it exists.
   */
  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  /**
   * Get the environment variables service.
   */
  private getEnvVarsService(): EnvironmentVariablesService {
    return this.envVarsService as EnvironmentVariablesService;
  }

  /**
   * Check if a metric is new or not.
   *
   * A metric is considered new if there is no metric with the same name already stored.
   *
   * When a metric is not new, we also check if the unit is consistent with the stored metric with
   * the same name. If the units are inconsistent, we throw an error as this is likely a bug or typo.
   * This can happen if a metric is added without using the `MetricUnit` helper in JavaScript codebases.
   *
   * @param name - The name of the metric
   * @param unit - The unit of the metric
   */
  private isNewMetric(name: string, unit: MetricUnit): boolean {
    if (this.storedMetrics[name]) {
      if (this.storedMetrics[name].unit !== unit) {
        const currentUnit = this.storedMetrics[name].unit;
        throw new Error(
          `Metric "${name}" has already been added with unit "${currentUnit}", but we received unit "${unit}". Did you mean to use metric unit "${currentUnit}"?`
        );
      }

      return false;
    }
    return true;
  }

  /**
   * Initialize the console property as an instance of the internal version of `Console()` class (PR #748)
   * or as the global node console if the `POWERTOOLS_DEV' env variable is set and has truthy value.
   *
   * @private
   */
  private setConsole(): void {
    if (!this.getEnvVarsService().isDevMode()) {
      this.console = new Console({
        stdout: process.stdout,
        stderr: process.stderr,
      });
    } else {
      this.console = console;
    }
  }

  /**
   * Set the custom config service to be used.
   *
   * @param customConfigService The custom config service to be used
   */
  private setCustomConfigService(
    customConfigService?: ConfigServiceInterface
  ): void {
    this.customConfigService = customConfigService
      ? customConfigService
      : undefined;
  }

  /**
   * Set the environment variables service to be used.
   */
  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

  /**
   * Set the namespace to be used.
   *
   * @param namespace - The namespace to be used
   */
  private setNamespace(namespace: string | undefined): void {
    this.namespace = (namespace ||
      this.getCustomConfigService()?.getNamespace() ||
      this.getEnvVarsService().getNamespace()) as string;
  }

  /**
   * Set the disbaled flag based on the environment variables `POWERTOOLS_METRICS_DISABLED` and `POWERTOOLS_DEV`.
   *
   * The `POWERTOOLS_METRICS_DISABLED` environment variable takes precedence over `POWERTOOLS_DEV`.
   */
  private setDisabled(): void {
    this.disabled = this.getEnvVarsService().getMetricsDisabled();
  }

  /**
   * Set the options to be used by the Metrics instance.
   *
   * This method is used during the initialization of the Metrics instance.
   *
   * @param options - The options to be used
   */
  private setOptions(options: MetricsOptions): Metrics {
    const {
      customConfigService,
      namespace,
      serviceName,
      singleMetric,
      defaultDimensions,
    } = options;

    this.setEnvVarsService();
    this.setConsole();
    this.setCustomConfigService(customConfigService);
    this.setDisabled();
    this.setNamespace(namespace);
    this.setService(serviceName);
    this.setDefaultDimensions(defaultDimensions);
    this.isSingleMetric = singleMetric || false;

    return this;
  }

  /**
   * Set the service to be used.
   *
   * @param service - The service to be used
   */
  private setService(service: string | undefined): void {
    const targetService =
      ((service ||
        this.getCustomConfigService()?.getServiceName() ||
        this.getEnvVarsService().getServiceName()) as string) ||
      this.defaultServiceName;
    if (targetService.length > 0) {
      this.setDefaultDimensions({ service: targetService });
    }
  }

  /**
   * Store a metric in the buffer.
   *
   * If the buffer is full, or the metric reaches the maximum number of values,
   * the metrics are flushed to stdout.
   *
   * @param name - The name of the metric to store
   * @param unit - The unit of the metric to store
   * @param value - The value of the metric to store
   * @param resolution - The resolution of the metric to store
   */
  private storeMetric(
    name: string,
    unit: MetricUnit,
    value: number,
    resolution: MetricResolution
  ): void {
    if (Object.keys(this.storedMetrics).length >= MAX_METRICS_SIZE) {
      this.publishStoredMetrics();
    }

    if (this.isNewMetric(name, unit)) {
      this.storedMetrics[name] = {
        unit,
        value,
        name,
        resolution,
      };
    } else {
      const storedMetric = this.storedMetrics[name];
      if (!Array.isArray(storedMetric.value)) {
        storedMetric.value = [storedMetric.value];
      }
      storedMetric.value.push(value);
      if (storedMetric.value.length === MAX_METRIC_VALUES_SIZE) {
        this.publishStoredMetrics();
      }
    }
  }

  /**
   * Validates a given timestamp based on CloudWatch Timestamp guidelines.
   *
   * Timestamp must meet CloudWatch requirements.
   * The time stamp can be up to two weeks in the past and up to two hours into the future.
   * See [Timestamps](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#about_timestamp)
   * for valid values.
   *
   * @param timestamp - Date object or epoch time in milliseconds representing the timestamp to validate.
   */
  #validateEmfTimestamp(timestamp: number | Date): boolean {
    const isDate = timestamp instanceof Date;
    if (!isDate && !isIntegerNumber(timestamp)) {
      return false;
    }

    const timestampMs = isDate ? timestamp.getTime() : timestamp;
    const currentTime = new Date().getTime();

    const minValidTimestamp = currentTime - EMF_MAX_TIMESTAMP_PAST_AGE;
    const maxValidTimestamp = currentTime + EMF_MAX_TIMESTAMP_FUTURE_AGE;

    return timestampMs >= minValidTimestamp && timestampMs <= maxValidTimestamp;
  }

  /**
   * Converts a given timestamp to EMF compatible format.
   *
   * @param timestamp - The timestamp to convert, which can be either a number (in milliseconds) or a Date object.
   * @returns The timestamp in milliseconds. If the input is invalid, returns 0.
   */
  #convertTimestampToEmfFormat(timestamp: number | Date): number {
    if (isIntegerNumber(timestamp)) {
      return timestamp;
    }
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    /**
     * If this point is reached, it indicates timestamp was neither a valid number nor Date
     * Returning zero represents the initial date of epoch time,
     * which will be skipped by Amazon CloudWatch.
     **/
    return 0;
  }
}

export { Metrics };
