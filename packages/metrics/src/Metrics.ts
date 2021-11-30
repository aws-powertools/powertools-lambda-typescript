import { MetricsInterface } from '.';
import {
  DecoratorOptions,
  Dimensions,
  EmfOutput,
  HandlerMethodDecorator,
  StoredMetrics,
  MetricsOptions,
  MetricUnit,
  MetricUnits,
} from '../types';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';

const MAX_METRICS_SIZE = 100;
const MAX_DIMENSION_COUNT = 9;
const DEFAULT_NAMESPACE = 'default_namespace';

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
  private raiseOnEmptyMetrics: boolean = false;
  private storedMetrics: StoredMetrics = {};

  public constructor(options: MetricsOptions = {}) {
    this.dimensions = {};
    this.setOptions(options);
  }

  public addDimension(name: string, value: string): void {
    if (MAX_DIMENSION_COUNT <= this.getCurrentDimensionsCount()) {
      throw new RangeError(`The number of metric dimensions must be lower than ${MAX_DIMENSION_COUNT}`);
    }
    this.dimensions[name] = value;
  }

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

  public addMetadata(key: string, value: string): void {
    this.metadata[key] = value;
  }

  public addMetric(name: string, unit: MetricUnit, value: number): void {
    this.storeMetric(name, unit, value);
    if (this.isSingleMetric) this.purgeStoredMetrics();
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

  public logMetrics(options: DecoratorOptions = {}): HandlerMethodDecorator {
    const { raiseOnEmptyMetrics, defaultDimensions, captureColdStartMetric } = options;
    this.raiseOnEmptyMetrics = raiseOnEmptyMetrics || false;
    if (defaultDimensions !== undefined) {
      this.setDefaultDimensions(defaultDimensions);
    }

    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = (event, context, callback) => {
        this.functionName = context.functionName;

        if (captureColdStartMetric) this.captureColdStart();
        try {
          const result = originalMethod?.apply(this, [event, context, callback]);
          return result;
        } finally {
          this.purgeStoredMetrics();
        }
      };
    };
  }

  public purgeStoredMetrics(): void {
    const target = this.serializeMetrics();
    console.log(JSON.stringify(target));
    this.storedMetrics = {};
  }

  public serializeMetrics(): EmfOutput {
    const metricDefinitions = Object.values(this.storedMetrics).map((metricDefinition) => ({
      Name: metricDefinition.name,
      Unit: metricDefinition.unit,
    }));
    if (metricDefinitions.length === 0 && this.raiseOnEmptyMetrics) {
      throw new RangeError('The number of metrics recorded must be higher than zero');
    }

    /* TODO: Potentially a logger.warn users here if default namespace should be used? */
    /* if (!this.namespace) logger.warn('Namespace should be defined, default used'); */

    const metricValues = Object.values(this.storedMetrics).reduce(
      (result: { [key: string]: number }, { name, value }: { name: string; value: number }) => {
        result[name] = value;

        return result;
      },
      {},
    );

    const dimensionNames = [...Object.keys(this.defaultDimensions), ...Object.keys(this.dimensions)];

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

  public singleMetric(): Metrics {
    return new Metrics({
      namespace: this.namespace,
      service: this.dimensions.service,
      singleMetric: true,
    });
  }

  private captureColdStart(): void {
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

  private getCurrentDimensionsCount(): number {
    return Object.keys(this.dimensions).length + Object.keys(this.defaultDimensions).length;
  }

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getEnvVarsService(): EnvironmentVariablesService {
    return <EnvironmentVariablesService> this.envVarsService;
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
    const { customConfigService, namespace, service, singleMetric, defaultDimensions } = options;

    this.setEnvVarsService();
    this.setCustomConfigService(customConfigService);
    this.setNamespace(namespace);
    this.setService(service);
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
      this.purgeStoredMetrics();
    }
    this.storedMetrics[name] = {
      unit,
      value,
      name,
    };
  }
}

export { Metrics, MetricUnits };
