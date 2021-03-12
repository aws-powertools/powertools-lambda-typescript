interface ConfigServiceInterface {

  get(name: string): string

  getCurrentEnvironment(): string

  getIsContextEnabled(): boolean

  getLogLevel(): string

  getSampleRateValue(): number | undefined

  getServiceName(): string

}

export {
  ConfigServiceInterface
};