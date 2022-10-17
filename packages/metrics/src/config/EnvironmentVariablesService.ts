import { ConfigServiceInterface } from './ConfigServiceInterface';
import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';

class EnvironmentVariablesService extends CommonEnvironmentVariablesService implements ConfigServiceInterface {

  private namespaceVariable = 'POWERTOOLS_METRICS_NAMESPACE';
  private serviceVariable = 'POWERTOOLS_SERVICE_NAME';

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