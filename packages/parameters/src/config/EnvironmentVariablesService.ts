import { ConfigServiceInterface } from './ConfigServiceInterface';
import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';

class EnvironmentVariablesService extends CommonEnvironmentVariablesService implements ConfigServiceInterface {

  // Environment variables
  private parametersMaxAgeVariable = 'POWERTOOLS_PARAMETERS_MAX_AGE';
  private ssmDecryptVariable = 'POWERTOOLS_PARAMETERS_SSM_DECRYPT';

  public getParametersMaxAge(): number | undefined {
    const maxAge = this.get(this.parametersMaxAgeVariable);

    if (maxAge.length === 0) return undefined;
    
    try {
      return parseInt(maxAge, 10);
    } catch (error) {
      console.warn(
        `Invalid value for ${this.parametersMaxAgeVariable} environment variable: ${maxAge}, using default value of 5 seconds`
      );
    }
  }

  public getSSMDecrypt(): string {
    return this.get(this.ssmDecryptVariable);
  }

}

export {
  EnvironmentVariablesService,
};