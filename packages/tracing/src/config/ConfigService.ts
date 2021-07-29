import { ConfigServiceInterface } from '.';

abstract class ConfigService implements ConfigServiceInterface {

  // Custom environment variables
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';
  protected tracerCaptureErrorVariable = 'POWERTOOLS_TRACER_CAPTURE_ERROR';
  protected tracerCaptureResponseVariable = 'POWERTOOLS_TRACER_CAPTURE_RESPONSE';
  protected tracingEnabledVariable = 'POWERTOOLS_TRACE_ENABLED';

  abstract get(name: string): string;

  abstract getServiceName(): string;
  
  abstract getTracingCaptureError(): string;
  
  abstract getTracingCaptureResponse(): string;
  
  abstract getTracingEnabled(): string;

}

export {
  ConfigService
};