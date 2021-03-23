import { ConfigServiceInterface } from '.';

abstract class ConfigService implements ConfigServiceInterface {

  // Custom environment variables
  protected currentEnvironmentVariable = 'ENVIRONMENT';
  protected logLevelVariable = 'LOG_LEVEL';
  protected sampleRateValueVariable = 'POWERTOOLS_LOGGER_SAMPLE_RATE';
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';

  abstract get(name: string): string;

  abstract getCurrentEnvironment(): string;

  abstract getLogLevel(): string;

  abstract getSampleRateValue(): number | undefined;

  abstract getServiceName(): string;

}

export {
  ConfigService
};