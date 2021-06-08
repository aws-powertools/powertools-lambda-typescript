import { MetricsInterface } from '.';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import { MetricUnit, MetricsOptions } from '../types';

const MAX_METRICS_SIZE = 100;

class Metrics implements MetricsInterface {
  private customConfigService?: ConfigServiceInterface;

  private envVarsService?: EnvironmentVariablesService;
  private namespace?: string;
  private service?: string;
  private storedMetrics?:{name: string; unit: MetricUnit; value: unknown}[];

  public constructor(options: MetricsOptions = {}) {
    this.setOptions(options);
  }

  public addMetric(name: string, unit: MetricUnit, value: unknown): void {
    console.log(name, unit, value);
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
    if (this.storedMetrics?.length === 0) throw new Error('Must contain at least one metric');
    if (!this.namespace) throw new Error('Namespace must be defined');

  }

  private serializeMetrics(): object {
    return {
      '_aws': {
        'Timestamp': new Date().getTime(),
        'CloudWatchMetrics': [
          {
            'Namespace': this.namespace,
            //'Dimensions': [list(dimensions.keys())],  # [ "service" ]
            // 'Metrics': metric_names_and_units,
          }
        ]
      }
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
    this.service = (service || this.getCustomConfigService()?.getService() || this.getEnvVarsService().getService()) as string;
  }

  private storeMetric(name: string, unit: MetricUnit, value: unknown): void {
    this.storedMetrics = this.storedMetrics || [];
    if (this.storedMetrics.length > MAX_METRICS_SIZE) {

    }
    this.storedMetrics.push({
      name,
      unit,
      value
    });
  }

}

export {
  Metrics
};