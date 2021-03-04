import { ConfigServiceInterface } from './ConfigServiceInterface';

class EnvironmentConfigService implements ConfigServiceInterface {

  // Reserved environment variables
  public readonly traceIdVariable = '_X_AMZN_TRACE_ID';
  public readonly functionNameVariable = 'AWS_LAMBDA_FUNCTION_NAME';
  public readonly functionMemoryVariable = 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE';
  public readonly functionVersionVariable = 'AWS_LAMBDA_FUNCTION_VERSION';

  // Custom environment variables
  public readonly logLevelVariable = 'LOG_LEVEL';
  public readonly serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';
  public readonly logEventEnabledVariable = 'POWERTOOLS_LOGGER_LOG_EVENT';
  public readonly sampleRateValueVariable = 'POWERTOOLS_LOGGER_SAMPLE_RATE';

  public getXrayTraceId(): string {
    return this.get(this.traceIdVariable);
  }

  public getFunctionName(): string {
    return this.get(this.functionNameVariable);
  }

  public getFunctionMemory(): string {
    return this.get(this.functionMemoryVariable);
  }

  public getFunctionVersion(): string {
    return this.get(this.functionVersionVariable);
  }

  public getLogLevel(): string {
    return this.get(this.functionVersionVariable);
  }

  public getServiceName(): string {
    return this.get(this.serviceNameVariable);
  }

  public getSampleRateValue(): string {
    return this.get(this.sampleRateValueVariable);
  }

  public getLogEventEnabled(): boolean {
    return [ '1', 'TRUE', 'ON' ].includes(this.get(this.logEventEnabledVariable).toUpperCase());
  }

  protected get(name: string): string {
    return process.env[name] || '';
  }

}

export {
  EnvironmentConfigService,
};