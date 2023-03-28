interface ConfigServiceInterface {

  get?(name: string): string
  
  getServiceName(): string

}

export {
  ConfigServiceInterface,
};