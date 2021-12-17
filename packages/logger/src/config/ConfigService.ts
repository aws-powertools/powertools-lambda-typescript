import { ConfigServiceInterface } from '.';

abstract class ConfigService implements ConfigServiceInterface {

  // Custom environment variables
  protected currentEnvironmentVariable = 'ENVIRONMENT';
  protected logLevelVariable = 'LOG_LEVEL';
  protected sampleRateValueVariable = 'POWERTOOLS_LOGGER_SAMPLE_RATE';
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';

  public abstract get(name: string): string;

  public abstract getCurrentEnvironment(): string;

  public abstract getLogLevel(): string;

  public abstract getSampleRateValue(): number | undefined;

  public abstract getServiceName(): string;

}

export {
  ConfigService,
};