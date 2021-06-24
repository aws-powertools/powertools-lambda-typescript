import { ConfigServiceInterface } from '.';

abstract class ConfigService implements ConfigServiceInterface {

    // Custom environment variables
    protected tracingDisabledVariable = 'POWERTOOLS_TRACE_DISABLED';
    protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';
    protected tracerCaptureResponseVariable = 'POWERTOOLS_TRACER_CAPTURE_RESPONSE';
    protected tracerCaptureErrorVariable = 'POWERTOOLS_TRACER_CAPTURE_ERROR';

    abstract get(name: string): string;

    abstract getTracingDisabled(): boolean;

    abstract getServiceName(): string;

    abstract getTracingCaptureResponse(): boolean;

    abstract getTracingCaptureError(): boolean;
}

export {
    ConfigService
};