import { ConfigServiceInterface } from '.';

abstract class ConfigService implements ConfigServiceInterface {

  // Custom environment variables
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';
  protected tracerCaptureErrorVariable = 'POWERTOOLS_TRACER_CAPTURE_ERROR';
  protected tracerCaptureResponseVariable = 'POWERTOOLS_TRACER_CAPTURE_RESPONSE';
  protected tracingDisabledVariable = 'POWERTOOLS_TRACE_DISABLED';

  abstract get(name: string): string;

  abstract getServiceName(): string;
  
  abstract getTracingCaptureError(): string;
  
  abstract getTracingCaptureResponse(): string;
  
  abstract getTracingDisabled(): string;

}

export {
  ConfigService
};