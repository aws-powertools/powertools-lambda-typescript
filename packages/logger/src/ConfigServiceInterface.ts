interface ConfigServiceInterface {

  getXrayTraceId(): string

  getFunctionName(): string

  getFunctionMemory(): string

  getFunctionVersion(): string

  getLogLevel(): string

  getServiceName(): string

  getLogEvent(): boolean

  getSampleRate(): string

}

export {
  ConfigServiceInterface
};