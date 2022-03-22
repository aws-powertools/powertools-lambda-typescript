import { ConfigServiceInterface } from '.';

abstract class ConfigService implements ConfigServiceInterface {

  // Custom environment variables
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';
  protected tracerCaptureErrorVariable = 'POWERTOOLS_TRACER_CAPTURE_ERROR';
  protected tracerCaptureHTTPsRequestsVariable = 'POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS';
  protected tracerCaptureResponseVariable = 'POWERTOOLS_TRACER_CAPTURE_RESPONSE';
  protected tracingEnabledVariable = 'POWERTOOLS_TRACE_ENABLED';

  public abstract get(name: string): string;

  public abstract getCaptureHTTPsRequests(): string;

  public abstract getServiceName(): string;
  
  public abstract getTracingCaptureError(): string;
  
  public abstract getTracingCaptureResponse(): string;
  
  public abstract getTracingEnabled(): string;

}

export {
  ConfigService
};