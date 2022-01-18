import { Callback, Context } from 'aws-lambda';
import { MetricsInterface } from '.';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import {
  MetricsOptions,
  Dimensions,
  EmfOutput,
  HandlerMethodDecorator,
  StoredMetrics,
  ExtraOptions,
  MetricUnit,
  MetricUnits,
} from './types';

const MAX_METRICS_SIZE = 100;
const MAX_DIMENSION_COUNT = 9;
const DEFAULT_NAMESPACE = 'default_namespace';

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
 * ### Object oriented way with decorator
 *
 * If you are used to TypeScript Class usage to encapsulate your Lambda handler you can leverage the [@metrics.logMetrics()](./_aws_lambda_powertools_metrics.Metrics.html#logMetrics) decorator to automatically:
 *   * create cold start metric
 *   * flush buffered metrics
 *   * throw on empty metrics
 *
 * @example
 *
 * ```typescript
 * import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
 * import { Callback, Context } from 'aws-lambda';
 *
 * const metrics = new Metrics({ namespace:'MyService', serviceName:'withDecorator' });
 *
 * export class MyFunctionWithDecorator {
 *
 *   // FYI: Decorator might not render properly in VSCode mouse over due to https://github.com/microsoft/TypeScript/issues/39371 and might show as *@metrics* instead of `@metrics.logMetrics`
 *
 *   @metrics.logMetrics({ captureColdStartMetric: true, throwOnEmptyMetrics: true })
 *   public handler(_event: any, _context: Context, _callback: Callback<any>): void | Promise<void> {
 *    // ...
 *    metrics.addMetric('test-metric', MetricUnits.Count, 10);
 *    // ...
 *   }
 * }
 *
 * export const handlerClass = new MyFunctionWithDecorator();
 * export const handler = handlerClass.handler;
 * ```
 *
 * ### Standard function
 *
 * If you are used to classic JavaScript functions, you can leverage the different methods provided to create and publish metrics.
 *
 * @example
 *
 * ```typescript
 * import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
 *
 * const metrics = new Metrics({ namespace: 'MyService', serviceName: 'MyFunction' });
 *
 * export const handler = async (_event: any, _context: any): Promise<void> => {
 *   metrics.captureColdStartMetric();
 *   metrics.addMetric('test-metric', MetricUnits.Count, 10);
 *   metrics.publishStoredMetrics();
 * };
 * ```
 */
class Metrics implements MetricsInterface {
  private customConfigService?: ConfigServiceInterface;
  private defaultDimensions: Dimensions = {};
  private dimensions: Dimensions = {};
  private envVarsService?: EnvironmentVariablesService;
  private functionName?: string;
  private isColdStart: boolean = true;
  private isSingleMetric: boolean = false;
  private metadata: { [key: string]: string } = {};
  private namespace?: string;
  private shouldThrowOnEmptyMetrics: boolean = false;
  private storedMetrics: StoredMetrics = {};

  public constructor(options: MetricsOptions = {}) {
    this.dimensions = {};
    this.setOptions(options);
  }

  /**
   * Add a dimension to the metrics.
   * A dimension is a key-value pair that is used to group metrics.
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Dimension for more details.
   * @param name
   * @param value
   */
  public addDimension(name: string, value: string): void {
    if (MAX_DIMENSION_COUNT <= this.getCurrentDimensionsCount()) {
      throw new RangeError(`The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`);
    }
    this.dimensions[name] = value;
  }

  /**
   * Add multiple dimensions to the metrics.
   * @param dimensions
   */
  public addDimensions(dimensions: { [key: string]: string }): void {
    const newDimensions = { ...this.dimensions };
    Object.keys(dimensions).forEach((dimensionName) => {
      newDimensions[dimensionName] = dimensions[dimensionName];
    });
    if (Object.keys(newDimensions).length > MAX_DIMENSION_COUNT) {
      throw new RangeError(
        `Unable to add ${
          Object.keys(dimensions).length
        } dimensions: the number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`,
      );
    }
    this.dimensions = newDimensions;
  }

  /**
   * A high-cardinality data part of your Metrics log. This is useful when you want to search highly contextual information along with your metrics in your logs.
   * @param key
   * @param value
   */
  public addMetadata(key: string, value: string): void {
    this.metadata[key] = value;
  }

  /**
   * Add a metric to the metrics buffer.
   * @param name
   * @param unit
   * @param value
   */
  public addMetric(name: string, unit: MetricUnit, value: number): void {
    this.storeMetric(name, unit, value);
    if (this.isSingleMetric) this.publishStoredMetrics();
  }

  /**
   * Create a singleMetric to capture cold start.
   * If it's a cold start invocation, this feature will:
   *   * Create a separate EMF blob solely containing a metric named ColdStart
   *   * Add function_name and service dimensions
   *
   * This has the advantage of keeping cold start metric separate from your application metrics, where you might have unrelated dimensions.
   *
   * @example
   *
   * ```typescript
   * import { Metrics } from '@aws-lambda-powertools/metrics';
   * import { Context } from 'aws-lambda';
   *
   * const metrics = new Metrics({ namespace:'serverlessAirline', serviceName:'orders' });
   *
   * export const handler = async (event: any, context: Context): Promise<void> => {
   *     metrics.captureColdStartMetric();
   * };
   * ```
   */
  public captureColdStartMetric(): void {
    if (!this.isColdStart) return;
    this.isColdStart = false;
    const singleMetric = this.singleMetric();

    if (this.dimensions.service) {
      singleMetric.addDimension('service', this.dimensions.service);
    }
    if (this.functionName != null) {
      singleMetric.addDimension('function_name', this.functionName);
    }
    singleMetric.addMetric('ColdStart', MetricUnits.Count, 1);
  }

  public clearDefaultDimensions(): void {
    this.defaultDimensions = {};
  }

  public clearDimensions(): void {
    this.dimensions = {};
  }

  public clearMetadata(): void {
    this.metadata = {};
  }

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
   * import { Callback, Context } from 'aws-lambda';
   *
   * const metrics = new Metrics({ namespace:'CdkExample', serviceName:'withDecorator' });
   *
   * export class MyFunctionWithDecorator {
   *
   *   @metrics.logMetrics({ captureColdStartMetric: true })
   *   public handler(_event: any, _context: Context, _callback: Callback<any>): void | Promise<any> {
   *    // ...
   *   }
   * }
   *
   * export const handlerClass = new MyFunctionWithDecorator();
   * export const handler = handlerClass.handler;
   * ```
   *
   * @decorator Class
   */
  public logMetrics(options: ExtraOptions = {}): HandlerMethodDecorator {
    const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } = options;
    if (throwOnEmptyMetrics) {
      this.throwOnEmptyMetrics();
    }
    if (defaultDimensions !== undefined) {
      this.setDefaultDimensions(defaultDimensions);
    }

    return (target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = ( async (event: unknown, context: Context, callback: Callback): Promise<unknown> => {
        this.functionName = context.functionName;
        if (captureColdStartMetric) this.captureColdStartMetric();
          
        let result: unknown;
        try {
          result = await originalMethod?.apply(this, [ event, context, callback ]);
        } catch (error) {
          throw error;
        } finally {
          this.publishStoredMetrics();
        }
          
        return result;
      });

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
   * import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
   *
   * const metrics = new Metrics({ namespace: 'CdkExample', serviceName: 'MyFunction' }); // Sets metric namespace, and service as a metric dimension
   *
   * export const handler = async (_event: any, _context: any): Promise<void> => {
   *   metrics.addMetric('test-metric', MetricUnits.Count, 10);
   *   metrics.publishStoredMetrics();
   * };
   * ```
   */
  public publishStoredMetrics(): void {
    const target = this.serializeMetrics();
    console.log(JSON.stringify(target));
    this.storedMetrics = {};
  }

  /**
   * Function to create the right object compliant with Cloudwatch EMF (Event Metric Format).
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html for more details
   * @returns {string}
   */
  public serializeMetrics(): EmfOutput {
    const metricDefinitions = Object.values(this.storedMetrics).map((metricDefinition) => ({
      Name: metricDefinition.name,
      Unit: metricDefinition.unit,
    }));
    if (metricDefinitions.length === 0 && this.shouldThrowOnEmptyMetrics) {
      throw new RangeError('The number of metrics recorded must be higher than zero');
    }

    if (!this.namespace) console.warn('Namespace should be defined, default used');

    const metricValues = Object.values(this.storedMetrics).reduce(
      (result: { [key: string]: number | number[] }, { name, value }: { name: string; value: number | number[] }) => {
        result[name] = value;

        return result;
      },
      {},
    );

    const dimensionNames = [ ...Object.keys(this.defaultDimensions), ...Object.keys(this.dimensions) ];

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
   * singleMetric.addMetric('single-metric', MetricUnits.Percent, 50);
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
   * import { Context } from 'aws-lambda';
   *
   * const metrics = new Metrics({ namespace:'serverlessAirline', serviceName:'orders' });
   *
   * export const handler = async (event: any, context: Context): Promise<void> => {
   *     metrics.throwOnEmptyMetrics();
   *     metrics.publishStoredMetrics(); // will throw since no metrics added.
   * };
   * ```
   */
  public throwOnEmptyMetrics(): void {
    this.shouldThrowOnEmptyMetrics = true;
  }

  private getCurrentDimensionsCount(): number {
    return Object.keys(this.dimensions).length + Object.keys(this.defaultDimensions).length;
  }

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getEnvVarsService(): EnvironmentVariablesService {
    return <EnvironmentVariablesService> this.envVarsService;
  }

  private isNewMetric(name: string, unit: MetricUnit): boolean {
    if (this.storedMetrics[name]){
      // Inconsistent units indicates a bug or typos and we want to flag this to users early
      if (this.storedMetrics[name].unit !== unit) {
        const currentUnit = this.storedMetrics[name].unit;
        throw new Error(`Metric "${name}" has already been added with unit "${currentUnit}", but we received unit "${unit}". Did you mean to use metric unit "${currentUnit}"?`);
      }
      
      return false;
    } else {
      return true;
    }
  }

  private setCustomConfigService(customConfigService?: ConfigServiceInterface): void {
    this.customConfigService = customConfigService ? customConfigService : undefined;
  }

  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

  private setNamespace(namespace: string | undefined): void {
    this.namespace = (namespace ||
      this.getCustomConfigService()?.getNamespace() ||
      this.getEnvVarsService().getNamespace()) as string;
  }

  private setOptions(options: MetricsOptions): Metrics {
    const { customConfigService, namespace, serviceName, singleMetric, defaultDimensions } = options;

    this.setEnvVarsService();
    this.setCustomConfigService(customConfigService);
    this.setNamespace(namespace);
    this.setService(serviceName);
    this.setDefaultDimensions(defaultDimensions);
    this.isSingleMetric = singleMetric || false;

    return this;
  }

  private setService(service: string | undefined): void {
    const targetService = (service ||
      this.getCustomConfigService()?.getService() ||
      this.getEnvVarsService().getService()) as string;
    if (targetService.length > 0) {
      this.addDimension('service', targetService);
    }
  }

  private storeMetric(name: string, unit: MetricUnit, value: number): void {
    if (Object.keys(this.storedMetrics).length >= MAX_METRICS_SIZE) {
      this.publishStoredMetrics();
    }

    if (this.isNewMetric(name, unit)) {
      this.storedMetrics[name] = {
        unit,
        value,
        name,
      };
    } else {
      const storedMetric = this.storedMetrics[name];
      if (!Array.isArray(storedMetric.value)) {
        storedMetric.value = [storedMetric.value];
      }
      storedMetric.value.push(value);
    }
  }

}

export { Metrics, MetricUnits };
