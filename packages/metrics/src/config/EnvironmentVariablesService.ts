import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';
import type { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';

/**
 * Class EnvironmentVariablesService
 *
 * This class is used to return environment variables that are available in the runtime of
 * the current Lambda invocation.
 */
class EnvironmentVariablesService
  extends CommonEnvironmentVariablesService
  implements ConfigServiceInterface
{
  private namespaceVariable = 'POWERTOOLS_METRICS_NAMESPACE';

  private readonly disabledVariable = 'POWERTOOLS_METRICS_DISABLED';

  /**
   * Get the value of the `POWERTOOLS_METRICS_NAMESPACE` environment variable.
   */
  public getNamespace(): string {
    return this.get(this.namespaceVariable);
  }

  /**
   * Get the value of the `POWERTOOLS_METRICS_DISABLED` environment variable.
   */
  public getMetricsDisabled(): boolean | undefined {
    const value = this.get(this.disabledVariable);

    if (this.isValueTrue(value)) return true;

    if (this.isValueFalse(value)) return false;

    return undefined;
  }
}

export { EnvironmentVariablesService };
