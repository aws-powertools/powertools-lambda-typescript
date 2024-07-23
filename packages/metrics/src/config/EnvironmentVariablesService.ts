import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';
import type { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';

class EnvironmentVariablesService
  extends CommonEnvironmentVariablesService
  implements ConfigServiceInterface
{
  private namespaceVariable = 'POWERTOOLS_METRICS_NAMESPACE';

  /**
   * It returns the value of the POWERTOOLS_METRICS_NAMESPACE environment variable.
   *
   * @returns {string}
   */
  public getNamespace(): string {
    return this.get(this.namespaceVariable);
  }
}

export { EnvironmentVariablesService };
