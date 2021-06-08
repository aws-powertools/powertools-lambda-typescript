import { ConfigService } from '.';

class EnvironmentVariablesService extends ConfigService {

  private namespaceVariable = 'POWERTOOLS_METRICS_NAMESPACE';
  private serviceVariable = 'POWERTOOLS_METRICS_SERVICE';

  public get(name: string): string {
    return process.env[name]?.trim() || '';
  }

  public getNamespace(): string {
    return this.get(this.namespaceVariable);
  }
  public getService(): string {
    return this.get(this.serviceVariable);
  }

}

export {
  EnvironmentVariablesService,
};