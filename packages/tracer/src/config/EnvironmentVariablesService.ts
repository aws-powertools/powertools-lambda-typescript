import { ConfigServiceInterface } from './ConfigServiceInterface';
import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';

class EnvironmentVariablesService extends CommonEnvironmentVariablesService implements ConfigServiceInterface {

  // Environment variables
  private awsExecutionEnv = 'AWS_EXECUTION_ENV';
  private samLocalVariable = 'AWS_SAM_LOCAL';
  private tracerCaptureErrorVariable = 'POWERTOOLS_TRACER_CAPTURE_ERROR';
  private tracerCaptureHTTPsRequestsVariable = 'POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS';
  private tracerCaptureResponseVariable = 'POWERTOOLS_TRACER_CAPTURE_RESPONSE';
  private tracingEnabledVariable = 'POWERTOOLS_TRACE_ENABLED';

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
    return super.getXrayTraceId();
  }
}

export {
  EnvironmentVariablesService,
};