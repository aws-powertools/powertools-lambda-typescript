interface ConfigServiceInterface {

    get(name: string): string

    getTracingDisabled(): boolean

    getServiceName(): string

    getTracingCaptureResponse(): boolean;

    getTracingCaptureError(): boolean;
}

export {
    ConfigServiceInterface
};