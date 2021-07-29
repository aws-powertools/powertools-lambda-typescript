interface ConfigServiceInterface {

  get(name: string): string

  getTracingEnabled(): string

  getServiceName(): string

  getTracingCaptureResponse(): string

  getTracingCaptureError(): string
}

export {
  ConfigServiceInterface
};