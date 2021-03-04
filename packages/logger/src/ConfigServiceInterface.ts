interface ConfigServiceInterface {

  getXrayTraceId(): string

  getFunctionName(): string

  getFunctionMemory(): string

  getFunctionVersion(): string

  getLogLevel(): string

  getServiceName(): string

  getLogEventEnabled(): boolean

  getSampleRateValue(): string

}

export {
  ConfigServiceInterface
};