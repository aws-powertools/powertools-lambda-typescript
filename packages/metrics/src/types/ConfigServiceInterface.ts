interface ConfigServiceInterface {
  get?(name: string): string;
  getNamespace(): string;
  getServiceName(): string;
  /**
   * It returns the value of the POWERTOOLS_DEV environment variable.
   *
   * @returns {boolean}
   */
  isDevMode(): boolean;
}

export { ConfigServiceInterface };
