import { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';
import { DEFAULT_MAX_AGE_SECS } from '../constants.js';
import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';

class EnvironmentVariablesService
  extends CommonEnvironmentVariablesService
  implements ConfigServiceInterface
{
  // Environment variables
  private parametersMaxAgeVariable = 'POWERTOOLS_PARAMETERS_MAX_AGE';
  private ssmDecryptVariable = 'POWERTOOLS_PARAMETERS_SSM_DECRYPT';

  public getParametersMaxAge(): number | undefined {
    const maxAge = this.get(this.parametersMaxAgeVariable);

    if (maxAge.length === 0) return undefined;

    const maxAgeAsNumber = parseInt(maxAge, 10);
    if (isNaN(maxAgeAsNumber)) {
      console.warn(
        `Invalid value for ${this.parametersMaxAgeVariable} environment variable: [${maxAge}], using default value of ${DEFAULT_MAX_AGE_SECS} seconds`
      );
    } else {
      return maxAgeAsNumber;
    }
  }

  public getSSMDecrypt(): string {
    return this.get(this.ssmDecryptVariable);
  }
}

export { EnvironmentVariablesService };
