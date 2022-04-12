import { ConfigService } from '.';

class EnvironmentVariablesService extends ConfigService {

  // Environment variables
  private awsExecutionEnv = 'AWS_EXECUTION_ENV';
  private samLocalVariable = 'AWS_SAM_LOCAL';
  private xRayTraceIdVariable = '_X_AMZN_TRACE_ID';

  public get(name: string): string {
    return process.env[name]?.trim() || '';
  }

  public getAwsExecutionEnv(): string {
    return this.get(this.awsExecutionEnv);
  }

  public getCaptureHTTPsRequests(): string {
    return this.get(this.tracerCaptureHTTPsRequestsVariable);
  }

  public getSamLocal(): string {
    return this.get(this.samLocalVariable);
  }

  public getServiceName(): string {
    return this.get(this.serviceNameVariable);
  }

  public getTracingCaptureError(): string {
    return this.get(this.tracerCaptureErrorVariable);
  }
  
  public getTracingCaptureResponse(): string {
    return this.get(this.tracerCaptureResponseVariable);
  }
  
  public getTracingEnabled(): string {
    return this.get(this.tracingEnabledVariable);
  }

  public getXrayTraceId(): string {
    return this.get(this.xRayTraceIdVariable);
  }
}

export {
  EnvironmentVariablesService,
};