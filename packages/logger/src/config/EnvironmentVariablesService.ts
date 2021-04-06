import { ConfigService } from '.';

class EnvironmentVariablesService extends ConfigService {

  // Reserved environment variables
  private awsRegionVariable = 'AWS_REGION';
  private functionNameVariable = 'AWS_LAMBDA_FUNCTION_NAME';
  private functionVersionVariable = 'AWS_LAMBDA_FUNCTION_VERSION';
  private memoryLimitInMBVariable = 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE';
  private xRayTraceIdVariable = '_X_AMZN_TRACE_ID';

  public get(name: string): string {
    return process.env[name]?.trim() || '';
  }

  public getAwsRegion(): string {
    return this.get(this.awsRegionVariable);
  }

  public getCurrentEnvironment(): string {
    return this.get(this.currentEnvironmentVariable);
  }

  public getFunctionMemory(): number {
    const value = this.get(this.memoryLimitInMBVariable);

    return Number(value);
  }

  public getFunctionName(): string {
    return this.get(this.functionNameVariable);
  }

  public getFunctionVersion(): string {
    return this.get(this.functionVersionVariable);
  }

  public getLogLevel(): string {
    return this.get(this.logLevelVariable);
  }

  public getSampleRateValue(): number | undefined {
    const value = this.get(this.sampleRateValueVariable);
    
    return (value && value.length > 0) ? Number(value) : undefined;
  }

  public getServiceName(): string {
    return this.get(this.serviceNameVariable);
  }

  public getXrayTraceId(): string {
    return this.get(this.xRayTraceIdVariable);
  }

}

export {
  EnvironmentVariablesService,
};