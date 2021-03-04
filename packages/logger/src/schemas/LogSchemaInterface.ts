interface LogSchemaInterface {

  getTimestampKey(): string

  getLogLevelKey(): string

  getSourceCodeLocationKey(): string

  getServiceNameKey(): string

  getSampleRateValueKey(): string

  getSampleRateValueKey(): string

  getMessageKey(): string

  getXrayTraceIdKey(): string

  getColdStartKey(): string

  getFunctionNameKey(): string

  getFunctionMemorySizeKey(): string

  getFunctionArnKey(): string

  getFunctionRequestIdKey(): string

}

export {
  LogSchemaInterface
};