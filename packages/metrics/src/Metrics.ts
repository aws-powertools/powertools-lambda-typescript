import { MetricsInterface } from '.';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import { MetricUnit, MetricsOptions, EmfOutput } from '../types';

const MAX_METRICS_SIZE = 100;
const MAX_DIMENSION_COUNT = 9;

class Metrics implements MetricsInterface {
  private customConfigService?: ConfigServiceInterface;
  private dimensions: {[key: string]: string} = {};
  private envVarsService?: EnvironmentVariablesService;
  private metadata: { [key: string]: string } = {};
  private namespace?: string;
  private storedMetrics:{ [key: string]: { name: string; unit: MetricUnit; value: number } } = {};

  public constructor(options: MetricsOptions = {}) {
    this.dimensions = {};
    this.setOptions(options);
  }

  public addDimension(name: string, value: string): void {
    if (MAX_DIMENSION_COUNT <= Object.keys(this.dimensions).length) {
      throw new Error('Max dimension count hit');
    }
    this.dimensions[name] = value;
  }

  public addMetadata(key: string, value: string): void {
    this.metadata[key] = value;
  }

  public addMetric(name: string, unit: MetricUnit, value: number): void {
    this.storeMetric(name, unit, value);
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

  public logMetrics(): void {
    this.purgeStoredMetrics();
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

  private serializeMetrics(): EmfOutput {
    const metricDefinitions = Object.values(this.storedMetrics).map((metricDefinition) => ({
      Name: metricDefinition.name,
      Unit: metricDefinition.unit
    }));
    if (metricDefinitions.length === 0) throw new Error('Must contain at least one metric');
    if (!this.namespace) throw new Error('Namespace must be defined');

    const metricValues = Object.values(this.storedMetrics).reduce((result: { [key: string]: number }, { name, value }: { name: string; value: number }) => {
      result[name] = value;

      return result;
    }, {});

    const dimensionNames = Object.keys(this.dimensions);

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
      ...this.dimensions,
      ...metricValues,
      ...this.metadata,
    };
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
    } = options;
    this.setEnvVarsService();
    this.setCustomConfigService(customConfigService);
    this.setNamespace(namespace);
    this.setService(service);

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
  Metrics
};