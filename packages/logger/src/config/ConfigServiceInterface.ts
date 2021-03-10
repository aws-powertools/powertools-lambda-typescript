interface ConfigServiceInterface {

  get(name: string): string

  getCurrentEnvironment(): string

  getLogLevel(): string

  getSampleRateValue(): number | undefined

  getServiceName(): string

}

export {
  ConfigServiceInterface
};