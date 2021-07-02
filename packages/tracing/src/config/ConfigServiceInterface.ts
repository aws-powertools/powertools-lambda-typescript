interface ConfigServiceInterface {

  get(name: string): string

  getTracingDisabled(): string

  getServiceName(): string

  getTracingCaptureResponse(): string

  getTracingCaptureError(): string
}

export {
  ConfigServiceInterface
};