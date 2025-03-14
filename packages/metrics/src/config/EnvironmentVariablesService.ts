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
  private readonly functionNameVariable = 'POWERTOOLS_METRICS_FUNCTION_NAME';

  private readonly disabledVariable = 'POWERTOOLS_METRICS_DISABLED';

  /**
   * Get the value of the `POWERTOOLS_METRICS_NAMESPACE` environment variable.
   */
  public getNamespace(): string {
    return this.get(this.namespaceVariable);
  }

  /**
   * Get the value of the `POWERTOOLS_METRICS_FUNCTION_NAME` environment variable.
   */
  public getFunctionName(): string {
    return this.get(this.functionNameVariable);
  }

  /**
   * Get the value of the `POWERTOOLS_METRICS_DISABLED` or `POWERTOOLS_DEV` environment variables.
   *
   * The `POWERTOOLS_METRICS_DISABLED` environment variable takes precedence over `POWERTOOLS_DEV`.
   */
  public getMetricsDisabled(): boolean {
    const value = this.get(this.disabledVariable);

    if (this.isValueFalse(value)) return false;
    if (this.isValueTrue(value)) return true;
    if (this.isDevMode()) return true;

    return false;
  }
}

export { EnvironmentVariablesService };
