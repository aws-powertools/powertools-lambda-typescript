import { MetricsInterface } from '.';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import {
  DecoratorOptions,
  Dimensions,
  EmfOutput,
  HandlerMethodDecorator,
  MetricsOptions,
  MetricUnit,
  MetricUnits
} from '../types';

const MAX_METRICS_SIZE = 100;
const MAX_DIMENSION_COUNT = 9;

class Metrics implements MetricsInterface {
  private customConfigService?: ConfigServiceInterface;
  private default_dimensions: Dimensions = {};
  private dimensions: Dimensions = {};
  private envVarsService?: EnvironmentVariablesService;
  private functionName?:string;
  private isColdStart: boolean = true;
  private isSingleMetric: boolean = false;
  private metadata: { [key: string]: string } = {};
  private namespace?: string;
  private raiseOnEmptyMetrics: boolean = false;
  private storedMetrics:{ [key: string]: { name: string; unit: MetricUnit; value: number } } = {};

  public constructor(options: MetricsOptions = {}) {
    this.dimensions = {};
    this.setOptions(options);
  }

  public addDimension(name: string, value: string): void {
    if (MAX_DIMENSION_COUNT <= (Object.keys(this.dimensions).length + Object.keys(this.default_dimensions).length)) {
      throw new Error('Max dimension count hit');
    }
    this.dimensions[name] = value;
  }

  public addMetadata(key: string, value: string): void {
    this.metadata[key] = value;
  }

  public addMetric(name: string, unit: MetricUnit, value: number): void {
    this.storeMetric(name, unit, value);
    if (this.isSingleMetric) this.purgeStoredMetrics();
  }

  public clearDefaultDimensions():void {
    this.default_dimensions={};
  }

  public clearDimensions():void {
    this.dimensions={};
  }

  public clearMetadata(): void {
    this.metadata = {};
  }

  public clearMetrics(): void {
    this.storedMetrics={};
  }

  public logMetrics(options: DecoratorOptions = {}): HandlerMethodDecorator {
    const { raiseOnEmptyMetrics, defaultDimensions, captureColdStartMetric } = options;
    this.raiseOnEmptyMetrics = raiseOnEmptyMetrics || false;
    if (defaultDimensions) {
      this.setDefaultDimensions(defaultDimensions);
    }

    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = (event, context, callback) => {
        this.functionName = context.functionName;

        if (captureColdStartMetric) this.captureColdStart();
        const result = originalMethod?.apply(this, [ event, context, callback ]);
        this.purgeStoredMetrics();

        return result;
      };
    };
  }

  public serializeMetrics(): EmfOutput {
    const metricDefinitions = Object.values(this.storedMetrics).map((metricDefinition) => ({
      Name: metricDefinition.name,
      Unit: metricDefinition.unit
    }));
    if (metricDefinitions.length === 0) {
      if (this.raiseOnEmptyMetrics) {
        throw new Error('Must contain at least one metric');
      }
    }
    if (!this.namespace) throw new Error('Namespace must be defined');

    const metricValues = Object.values(this.storedMetrics).reduce((result: { [key: string]: number }, { name, value }: { name: string; value: number }) => {
      result[name] = value;

      return result;
    }, {});

    const dimensionNames = [ ...Object.keys(this.dimensions), ...Object.keys(this.default_dimensions) ];

    return {
      _aws: {
        Timestamp: new Date().getTime(),
        CloudWatchMetrics: [
          {
            Namespace: this.namespace,
            Dimensions: [dimensionNames],
            Metrics: metricDefinitions,
          }
        ]
      },
      ...this.default_dimensions,
      ...this.dimensions,
      ...metricValues,
      ...this.metadata,
    };
  }

  public setDefaultDimensions(dimensions: Dimensions): void {
    if (Object.keys(this.dimensions).length > 0) {
      throw new Error('Default dimensions must be set before dynamic dimensions are added');
    }
    const targetDimensions = {
      ...this.default_dimensions,
      ...dimensions
    };
    if (MAX_DIMENSION_COUNT <= Object.keys(targetDimensions).length) {
      throw new Error('Max dimension count hit');

      return;
    }
    this.default_dimensions=targetDimensions;
  }

  public singleMetric(): Metrics {
    return new Metrics({
      namespace: this.namespace,
      service: this.dimensions['service'],
      singleMetric: true
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

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getEnvVarsService(): EnvironmentVariablesService {
    if (!this.envVarsService) {
      this.setEnvVarsService();
    }

    return <EnvironmentVariablesService> this.envVarsService;
  }

  private purgeStoredMetrics(): void {
    const target = this.serializeMetrics();
    console.log(JSON.stringify(target));
    this.storedMetrics = {};
  }

  private setCustomConfigService(customConfigService?: ConfigServiceInterface): void {
    this.customConfigService = customConfigService? customConfigService : undefined;
  }

  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

  private setNamespace(namespace: string | undefined): void {
    this.namespace = (namespace || this.getCustomConfigService()?.getNamespace() || this.getEnvVarsService().getNamespace()) as string;
  }

  private setOptions(options: MetricsOptions = {}): Metrics {
    const {
      customConfigService,
      namespace,
      service,
      singleMetric
    } = options;
    this.setEnvVarsService();
    this.setCustomConfigService(customConfigService);
    this.setNamespace(namespace);
    this.setService(service);
    this.isSingleMetric = singleMetric || false;

    return this;
  }

  private setService(service: string | undefined): void {
    const targetService = (service || this.getCustomConfigService()?.getService() || this.getEnvVarsService().getService()) as string;
    if (targetService) {
      this.addDimension('service', targetService);
    }
  }

  private storeMetric(name: string, unit: MetricUnit, value: number): void {
    this.storedMetrics = this.storedMetrics || {};
    if (Object.keys(this.storedMetrics).length > MAX_METRICS_SIZE) {
      this.purgeStoredMetrics();
    }
    this.storedMetrics[name] = {
      unit,
      value,
      name
    };
  }

}

export {
  Metrics,
  MetricUnits
};