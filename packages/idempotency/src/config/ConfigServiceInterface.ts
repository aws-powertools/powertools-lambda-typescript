interface ConfigServiceInterface {

  get(name: string): string

  getServiceName(): string

  getFunctionName(): string

}

export {
  ConfigServiceInterface
};