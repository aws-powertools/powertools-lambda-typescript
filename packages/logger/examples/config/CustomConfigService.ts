import { EnvironmentVariablesService } from '../../src/config';

class CustomConfigService extends EnvironmentVariablesService {

  // Custom environment variables
  protected customEnvironmentVariable = 'CUSTOM_ENV';

  public constructor() {
    super();
  }

  public getCurrentEnvironment(): string {
    return this.get(this.customEnvironmentVariable);
  }

}

export {
  CustomConfigService
};