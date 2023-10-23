interface ConfigServiceInterface {
  get(name: string): string;

  getCaptureHTTPsRequests(): string;

  getTracingEnabled(): string;

  getServiceName(): string;

  getTracingCaptureResponse(): string;

  getTracingCaptureError(): string;
}

export type { ConfigServiceInterface };
