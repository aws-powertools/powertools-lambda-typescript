import type { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';
import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';

class EnvironmentVariablesService
  extends CommonEnvironmentVariablesService
  implements ConfigServiceInterface
{
  private namespaceVariable = 'POWERTOOLS_METRICS_NAMESPACE';

  public getNamespace(): string {
    return this.get(this.namespaceVariable);
  }
}

export { EnvironmentVariablesService };
