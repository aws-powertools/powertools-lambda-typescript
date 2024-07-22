import type { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';
import { DEFAULT_MAX_AGE_SECS } from '../constants.js';
import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';

class EnvironmentVariablesService
  extends CommonEnvironmentVariablesService
  implements ConfigServiceInterface
{
  // Environment variables
  private parametersMaxAgeVariable = 'POWERTOOLS_PARAMETERS_MAX_AGE';
  private ssmDecryptVariable = 'POWERTOOLS_PARAMETERS_SSM_DECRYPT';

  /**
   * It returns the value of the POWERTOOLS_PARAMETERS_MAX_AGE environment variable.
   *
   * @returns {number|undefined}
   */
  public getParametersMaxAge(): number | undefined {
    const maxAge = this.get(this.parametersMaxAgeVariable);

    if (maxAge.length === 0) return undefined;

    const maxAgeAsNumber = Number.parseInt(maxAge, 10);
    if (Number.isNaN(maxAgeAsNumber)) {
      console.warn(
        `Invalid value for ${this.parametersMaxAgeVariable} environment variable: [${maxAge}], using default value of ${DEFAULT_MAX_AGE_SECS} seconds`
      );
    } else {
      return maxAgeAsNumber;
    }
  }

  /**
   * It returns the value of the POWERTOOLS_PARAMETERS_SSM_DECRYPT environment variable.
   *
   * @returns {string}
   */
  public getSSMDecrypt(): string {
    return this.get(this.ssmDecryptVariable);
  }
}

export { EnvironmentVariablesService };
