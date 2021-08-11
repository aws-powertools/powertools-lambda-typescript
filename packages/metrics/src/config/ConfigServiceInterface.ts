interface ConfigServiceInterface {

  get?(name: string): string
  getNamespace(): string
  getService(): string

}

export {
  ConfigServiceInterface
};