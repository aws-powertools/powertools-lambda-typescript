import { Console } from 'node:console';
import { Utility } from '@aws-lambda-powertools/commons';
import type { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import type { Callback, Context, Handler } from 'aws-lambda';
import { EnvironmentVariablesService } from './config/EnvironmentVariablesService.js';
import {
  COLD_START_METRIC,
  DEFAULT_NAMESPACE,
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
 * ## Intro
 * Metrics creates custom metrics asynchronously by logging metrics to standard output following Amazon CloudWatch Embedded Metric Format (EMF).
 *
 * These metrics can be visualized through Amazon CloudWatch Console.
 *
 * ## Key features
 *   * Aggregate up to 100 metrics using a single CloudWatch EMF object (large JSON blob)
 *   * Validate against common metric definitions mistakes (metric unit, values, max dimensions, max metrics, etc)
 *   * Metrics are created asynchronously by CloudWatch service, no custom stacks needed
 *   * Context manager to create a one off metric with a different dimension
 *
 * ## Usage
 *
 * ### Functions usage with middleware
 *
 * Using this middleware on your handler function will automatically flush metrics after the function returns or throws an error.
 * Additionally, you can configure the middleware to easily:
 * * ensure that at least one metric is emitted before you flush them
 * * capture a `ColdStart` a metric
 * * set default dimensions for all your metrics
 *
 * @example
 * ```typescript
 * import { Metrics } from '@aws-lambda-powertools/metrics';
 * import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
 * import middy from '@middy/core';
 *
 * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
 *
 * const lambdaHandler = async (_event: unknown, _context: unknown) => {
 *   ...
 * };
 *
 * export const handler = middy(lambdaHandler).use(logMetrics(metrics));
 * ```
 *
 * ### Object oriented way with decorator
 *
 * If you are used to TypeScript Class usage to encapsulate your Lambda handler you can leverage the {@link Metrics.logMetrics} decorator to automatically:
 *   * capture a `ColdStart` metric
 *   * flush buffered metrics
 *   * throw on empty metrics
 *
 * @example
 *
 * ```typescript
 * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 *
 * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
 *
 * class Lambda implements LambdaInterface {
 *   // Decorate your handler with the logMetrics decorator
 *   ⁣@metrics.logMetrics({ captureColdStartMetric: true, throwOnEmptyMetrics: true })
 *   public handler(_event: unknown, _context: unknown): Promise<void> {
 *     // ...
 *     metrics.addMetric('test-metric', MetricUnit.Count, 10);
 *     // ...
 *   }
 * }
 *
 * const handlerClass = new Lambda();
 * export const handler = handlerClass.handler.bind(handlerClass);
 * ```
 *
 * ### Standard function
 *
 * If you are used to classic JavaScript functions, you can leverage the different methods provided to create and publish metrics.
 *
 * @example
 *
 * ```typescript
 * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
 *
 * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
 *
 * export const handler = async (_event: unknown, __context: unknown): Promise<void> => {
 *   metrics.captureColdStartMetric();
 *   metrics.addMetric('test-metric', MetricUnit.Count, 10);
 *   metrics.publishStoredMetrics();
 * };
 * ```
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
  private customConfigService?: ConfigServiceInterface;
  private defaultDimensions: Dimensions = {};
  private dimensions: Dimensions = {};
  private envVarsService?: EnvironmentVariablesService;
  private functionName?: string;
  private isSingleMetric = false;
  private metadata: Record<string, string> = {};
  private namespace?: string;
  private shouldThrowOnEmptyMetrics = false;
  private storedMetrics: StoredMetrics = {};

  public constructor(options: MetricsOptions = {}) {
    super();

    this.dimensions = {};
    this.setOptions(options);
  }

  /**
   * Add a dimension to the metrics.
   *
   * A dimension is a key-value pair that is used to group metrics.
   *
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Dimension for more details.
   * @param name The name of the dimension
   * @param value The value of the dimension
   */
  public addDimension(name: string, value: string): void {
    if (MAX_DIMENSION_COUNT <= this.getCurrentDimensionsCount()) {
      throw new RangeError(
        `The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`
      );
    }
    this.dimensions[name] = value;
  }

  /**
   * Add multiple dimensions to the metrics.
   *
   * A dimension is a key-value pair that is used to group metrics.
   *
   * @param dimensions A key-value pair of dimensions
   */
  public addDimensions(dimensions: { [key: string]: string }): void {
    const newDimensions = { ...this.dimensions };
    for (const dimensionName of Object.keys(dimensions)) {
      newDimensions[dimensionName] = dimensions[dimensionName];
    }
    if (Object.keys(newDimensions).length > MAX_DIMENSION_COUNT) {
      throw new RangeError(
        `Unable to add ${
          Object.keys(dimensions).length
        } dimensions: the number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`
      );
    }
    this.dimensions = newDimensions;
  }

  /**
   * A high-cardinality data part of your Metrics log.
   *
   * This is useful when you want to search highly contextual information along with your metrics in your logs.
   *
   * @param key The key of the metadata
   * @param value The value of the metadata
   */
  public addMetadata(key: string, value: string): void {
    this.metadata[key] = value;
  }

  /**
   * Add a metric to the metrics buffer.
   *
   * By default, metrics are buffered and flushed at the end of the Lambda invocation
   * or when calling {@link Metrics.publishStoredMetrics}.
   *
   * You can add a metric by specifying the metric name, unit, and value. For convenience,
   * we provide a set of constants for the most common units in {@link MetricUnit}.
   *
   * @example
   * ```typescript
   * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
   *
   * metrics.addMetric('successfulBooking', MetricUnit.Count, 1);
   * ```
   *
   * Optionally, you can specify the metric resolution, which can be either `High` or `Standard`.
   * By default, metrics are published with a resolution of `Standard`, click [here](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Resolution_definition)
   * to learn more about metric resolutions.
   *
   * @example
   * ```typescript
   * import { Metrics, MetricUnit, MetricResolution } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
   *
   * metrics.addMetric('successfulBooking', MetricUnit.Count, 1, MetricResolution.High);
   * ```
   *
   * @param name The metric name
   * @param unit The metric unit
   * @param value The metric value
   * @param resolution - The metric resolution
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
   * Create a singleMetric to capture cold start.
   *
   * If it's a cold start invocation, this feature will:
   *   * Create a separate EMF blob that contains a single metric named ColdStart
   *   * Add function_name and service dimensions
   *
   * This has the advantage of keeping cold start metric separate from your application metrics, where you might have unrelated dimensions,
   * as well as avoiding potential data loss from metrics not being published for other reasons.
   *
   * @example
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
   *
   * export const handler = async (_event: unknown, __context: unknown): Promise<void> => {
   *     metrics.captureColdStartMetric();
   * };
   * ```
   */
  public captureColdStartMetric(): void {
    if (!this.isColdStart()) return;
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
   * Clear all default dimensions.
   */
  public clearDefaultDimensions(): void {
    this.defaultDimensions = {};
  }

  /**
   * Clear all dimensions.
   */
  public clearDimensions(): void {
    this.dimensions = {};
  }

  /**
   * Clear all metadata.
   */
  public clearMetadata(): void {
    this.metadata = {};
  }

  /**
   * Clear all the metrics stored in the buffer.
   */
  public clearMetrics(): void {
    this.storedMetrics = {};
  }

  /**
   * A decorator automating coldstart capture, throw on empty metrics and publishing metrics on handler exit.
   *
   * @example
   *
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
   *
   * class Lambda implements LambdaInterface {
   *   @metrics.logMetrics({ captureColdStartMetric: true })
   *   public handler(_event: unknown, __context: unknown): Promise<void> {
   *     // ...
   *   }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);
   * ```
   *
   * @param options - The options to configure the logMetrics decorator
   */
  public logMetrics(options: ExtraOptions = {}): HandlerMethodDecorator {
    const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } =
      options;
    if (throwOnEmptyMetrics) {
      this.throwOnEmptyMetrics();
    }
    if (defaultDimensions !== undefined) {
      this.setDefaultDimensions(defaultDimensions);
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
        metricsRef.functionName = context.functionName;
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
   * Synchronous function to actually publish your metrics. (Not needed if using logMetrics decorator).
   * It will create a new EMF blob and log it to standard output to be then ingested by Cloudwatch logs and processed automatically for metrics creation.
   *
   * @example
   *
   * ```typescript
   * import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' }); // Sets metric namespace, and service as a metric dimension
   *
   * export const handler = async (_event: unknown, __context: unknown): Promise<void> => {
   *   metrics.addMetric('test-metric', MetricUnit.Count, 10);
   *   metrics.publishStoredMetrics();
   * };
   * ```
   */
  public publishStoredMetrics(): void {
    if (
      !this.shouldThrowOnEmptyMetrics &&
      Object.keys(this.storedMetrics).length === 0
    ) {
      console.warn(
        'No application metrics to publish. The cold-start metric may be published if enabled. ' +
          'If application metrics should never be empty, consider using `throwOnEmptyMetrics`'
      );
    }
    const target = this.serializeMetrics();
    this.console.log(JSON.stringify(target));
    this.clearMetrics();
    this.clearDimensions();
    this.clearMetadata();
  }

  /**
   * Function to create a new metric object compliant with the EMF (Embedded Metric Format) schema which
   * includes the metric name, unit, and optionally storage resolution.
   *
   * The function will create a new EMF blob and log it to standard output to be then ingested by Cloudwatch
   * logs and processed automatically for metrics creation.
   *
   * @returns metrics as JSON object compliant EMF Schema Specification
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html for more details
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
      console.warn('Namespace should be defined, default used');

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
        Timestamp: new Date().getTime(),
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
   * @param dimensions The default dimensions to be added to all metrics.
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
   * Sets the function name to be added to the metric.
   *
   * @param value The function name to be added to the metric.
   */
  public setFunctionName(value: string): void {
    this.functionName = value;
  }

  /**
   * CloudWatch EMF uses the same dimensions across all your metrics. Use singleMetric if you have a metric that should have different dimensions.
   *
   * You don't need to call publishStoredMetrics() after calling addMetric for a singleMetrics, they will be flushed directly.
   *
   * @example
   *
   * ```typescript
   * const singleMetric = metrics.singleMetric();
   * singleMetric.addDimension('InnerDimension', 'true');
   * singleMetric.addMetric('single-metric', MetricUnit.Percent, 50);
   * ```
   *
   * @returns the Metrics
   */
  public singleMetric(): Metrics {
    return new Metrics({
      namespace: this.namespace,
      serviceName: this.dimensions.service,
      defaultDimensions: this.defaultDimensions,
      singleMetric: true,
    });
  }

  /**
   * Throw an Error if the metrics buffer is empty.
   *
   * @example
   *
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName:'orders' });
   *
   * export const handler = async (_event: unknown, __context: unknown): Promise<void> => {
   *     metrics.throwOnEmptyMetrics();
   *     metrics.publishStoredMetrics(); // will throw since no metrics added.
   * };
   * ```
   */
  public throwOnEmptyMetrics(): void {
    this.shouldThrowOnEmptyMetrics = true;
  }

  /**
   * Gets the current number of dimensions stored.
   *
   * @returns the number of dimensions currently stored
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
   * @param name The name of the metric
   * @param unit The unit of the metric
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
   * Initialize the console property as an instance of the internal version of Console() class (PR #748)
   * or as the global node console if the `POWERTOOLS_DEV' env variable is set and has truthy value.
   *
   * @private
   * @returns {void}
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
   * @param namespace The namespace to be used
   */
  private setNamespace(namespace: string | undefined): void {
    this.namespace = (namespace ||
      this.getCustomConfigService()?.getNamespace() ||
      this.getEnvVarsService().getNamespace()) as string;
  }

  /**
   * Set the options to be used by the Metrics instance.
   *
   * This method is used during the initialization of the Metrics instance.
   *
   * @param options The options to be used
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
    this.setNamespace(namespace);
    this.setService(serviceName);
    this.setDefaultDimensions(defaultDimensions);
    this.isSingleMetric = singleMetric || false;

    return this;
  }

  /**
   * Set the service to be used.
   *
   * @param service The service to be used
   */
  private setService(service: string | undefined): void {
    const targetService =
      ((service ||
        this.getCustomConfigService()?.getServiceName() ||
        this.getEnvVarsService().getServiceName()) as string) ||
      this.getDefaultServiceName();
    if (targetService.length > 0) {
      this.setDefaultDimensions({ service: targetService });
    }
  }

  /**
   * Store a metric in the buffer.
   *
   * If the buffer is full, or the metric reaches the maximum number of values,
   * the buffer is published to stdout.
   *
   * @param name The name of the metric to store
   * @param unit The unit of the metric to store
   * @param value The value of the metric to store
   * @param resolution The resolution of the metric to store
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
}

export { Metrics };
